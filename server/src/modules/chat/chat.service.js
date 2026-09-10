import { chatRepository } from "./chat.repository.js";
import { messageRepository } from "../messages/message.repository.js";
import {
	AI_CONTEXT,
	AI_MODELS,
	AI_PROVIDERS,
	DEFAULT_MODEL,
	DEFAULT_PROVIDER,
	isSupportedModel,
} from "../ai/ai.constants.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { generateChatTitle } from "../../shared/utils/titleGenerator.js";
import { QueryBuilder } from "../../shared/utils/queryBuilder.js";
import { normalizeTokenUsage } from "../ai/utils/token-usage.js";

const SUMMARY_INTERVAL = 20000;
const activeChatMutations = new Set();

const withChatMutationLock = async (chatId, work) => {
	// Serialize mutations per chat so overlapping streams cannot corrupt message order or counters.
	const key = chatId.toString();

	if (activeChatMutations.has(key)) {
		throw new ApiError(
			HTTP_STATUS.CONFLICT,
			"Another message operation is already in progress for this chat.",
		);
	}

	activeChatMutations.add(key);

	try {
		return await work();
	} finally {
		activeChatMutations.delete(key);
	}
};

const createChat = async (userId, data) => {
	const provider = data.provider ?? DEFAULT_PROVIDER;
	const model =
		data.model ??
		(provider === AI_PROVIDERS.GEMINI ? AI_MODELS.GEMINI_FLASH : DEFAULT_MODEL);

	// A provider/model pair is validated here as well as at the HTTP boundary for service safety.
	if (!isSupportedModel(provider, model)) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"Model is not supported by the selected provider.",
		);
	}

	return chatRepository.create({
		user: userId,
		title: "New Chat",
		provider,
		model,
	});
};

const getChatsWithArchiveStatus = async (
	userId,
	query = {},
	isArchived = false,
) => {
	const builder = new QueryBuilder(query)
		.search()
		.filter("provider")
		.filter("model")
		.filter("isPinned")
		.paginate()
		.sort()
		.build();

	builder.filters.user = userId;
	builder.filters.isArchived = isArchived;

	// Fetch the current page and its total concurrently; neither query depends on the other.
	const [items, totalItems] = await Promise.all([
		chatRepository.findChats(builder),
		chatRepository.countChats(builder.filters),
	]);

	return {
		items,
		pagination: {
			page: builder.page,
			limit: builder.limit,
			totalItems,
			totalPages: Math.ceil(totalItems / builder.limit),
			hasNextPage: builder.page * builder.limit < totalItems,
			hasPreviousPage: builder.page > 1,
		},
	};
};

const getChats = (userId, query) => {
	return getChatsWithArchiveStatus(userId, query, false);
};

const getArchivedChats = (userId, query) => {
	return getChatsWithArchiveStatus(userId, query, true);
};

const getChatById = async (chatId, userId) => {
	return verifyChatAccess(chatId, userId);
};

const updateChat = async (chatId, userId, updates) => {
	const chat = await verifyChatAccess(chatId, userId);

	const provider = updates.provider ?? chat.provider;

	// Switching providers without a model must not leave the chat with an incompatible old model.
	const model =
		updates.model ??
		(updates.provider && updates.provider !== chat.provider
			? provider === AI_PROVIDERS.GEMINI
				? AI_MODELS.GEMINI_FLASH
				: DEFAULT_MODEL
			: chat.model);

	if (!isSupportedModel(provider, model)) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"Model is not supported by the selected provider.",
		);
	}

	// Keep this allow-list to prevent callers from changing ownership or internal counters.
	const allowedUpdates = Object.fromEntries(
		Object.entries({
			title: updates.title,
			isPinned: updates.isPinned,
			isArchived: updates.isArchived,
			provider: updates.provider,
			model: updates.model ?? (updates.provider ? model : undefined),
		}).filter(([, value]) => value !== undefined),
	);

	if (!Object.keys(allowedUpdates).length) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"At least one chat field is required.",
		);
	}

	const updatedChat = await chatRepository.updateById(chatId, allowedUpdates);

	if (!updatedChat) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "Chat not found.");
	}

	return updatedChat;
};

const deleteChat = async (chatId, userId) => {
	return withChatMutationLock(chatId, async () => {
		await getChatById(chatId, userId);

		// Messages have no database cascade, so remove them before deleting their chat.
		await messageRepository.deleteMessagesByChat(chatId);

		return chatRepository.deleteById(chatId);
	});
};

const verifyChatAccess = async (chatId, userId) => {
	const chat = await chatRepository.findById(chatId);

	if (!chat) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "Chat not found.");
	}

	if (chat.user.toString() !== userId.toString()) {
		// Ownership is checked in the service so every caller gets the same protection.
		throw new ApiError(
			HTTP_STATUS.FORBIDDEN,
			"You don't have access to this chat.",
		);
	}

	return chat;
};

const updateChatActivity = async (chatId, messageId, messageCreatedAt) => {
	return chatRepository.updateChatActivity(chatId, messageId, messageCreatedAt);
};

const updateChatTitle = async (chatId, firstMessage) => {
	const chat = await chatRepository.findById(chatId);

	if (!chat) return;

	if (chat.title !== "New Chat") {
		return;
	}

	const title = generateChatTitle(firstMessage);

	await chatRepository.updateById(chatId, { title });
};

const renameChat = async (chatId, userId, title) => {
	return updateChat(chatId, userId, { title });
};

const togglePin = async (chatId, userId) => {
	const chat = await verifyChatAccess(chatId, userId);

	return updateChat(chatId, userId, {
		isPinned: !chat.isPinned,
	});
};

const toggleArchive = async (chatId, userId) => {
	const chat = await verifyChatAccess(chatId, userId);

	return updateChat(chatId, userId, {
		isArchived: !chat.isArchived,
	});
};

const incrementTokenUsage = async (chatId, usage) => {
	if (!usage) return;

	// Provider usage may be incomplete or malformed; normalize before incrementing persisted totals.
	return chatRepository.incrementTokenUsage(chatId, normalizeTokenUsage(usage));
};

const updateSummary = async (chatId, summary, tokenUsage) => {
	return chatRepository.updateSummary(chatId, summary, tokenUsage);
};

const shouldGenerateSummary = async (chatId) => {
	const chat = await chatRepository.findById(chatId);

	if (!chat) {
		return false;
	}

	const totalTokens = chat.tokenUsage?.total ?? 0;

	const summaryTokens = chat.summary?.tokenUsage ?? 0;

	// The first summary waits for the larger threshold; later summaries only cover new usage.
	if (!chat.summary?.updatedAt) {
		return totalTokens >= AI_CONTEXT.SUMMARY_THRESHOLD;
	}

	return totalTokens >= summaryTokens + SUMMARY_INTERVAL;
};

export const chatService = {
	createChat,
	getChats,
	getArchivedChats,
	getChatById,
	updateChat,
	deleteChat,
	verifyChatAccess,
	updateChatActivity,
	updateChatTitle,
	renameChat,
	togglePin,
	toggleArchive,
	incrementTokenUsage,
	updateSummary,
	shouldGenerateSummary,
	withChatMutationLock,
};
