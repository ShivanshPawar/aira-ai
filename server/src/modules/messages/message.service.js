import { chatService } from "../chat/chat.service.js";
import { chatRepository } from "../chat/chat.repository.js";
import { messageRepository } from "./message.repository.js";
import {
	MESSAGE_ROLES,
	MESSAGE_STATUS,
} from "../../shared/constants/message.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { aiService } from "../ai/ai.service.js";
import {
	AI_CONTEXT,
	AI_PROVIDERS,
	DEFAULT_MODEL,
	DEFAULT_PROVIDER,
} from "../ai/ai.constants.js";
import { buildConversation } from "../ai/conversation.builder.js";
import { summaryService } from "../ai/services/summary.service.js";
import { AICancelledError } from "../ai/errors/ai-cancelled.error.js";
import { fileService } from "../files/file.service.js";
import { normalizeTokenUsage } from "../ai/utils/token-usage.js";

// Track background jobs per chat so concurrent responses do not create duplicate summaries.
const activeSummaryGenerations = new Set();

const getChatKey = (chatId) => chatId.toString();

const verifyAttachmentsForChat = async (userId, chat, attachments) => {
	// Verify ownership before an attachment URL is sent to an AI provider.
	const files = await fileService.verifyOwnership(userId, attachments);

	if (files.length && chat.provider !== AI_PROVIDERS.GEMINI) {
		throw new ApiError(
			HTTP_STATUS.BAD_REQUEST,
			"Attachments are currently supported only for Gemini chats.",
		);
	}

	return files;
};

const resolveAIOptions = (chat) => {
	const provider = chat.provider ?? DEFAULT_PROVIDER;

	const model = chat.model ?? DEFAULT_MODEL;

	const systemPrompt = chat.systemPrompt ?? undefined;

	return {
		provider,
		model,
		systemPrompt,
	};
};

const resolveContextTokenLimit = (provider) => {
	// Providers expose different context windows, so their history budgets differ too.
	return provider === AI_PROVIDERS.GROQ
		? AI_CONTEXT.GROQ_CONTEXT_TOKENS
		: AI_CONTEXT.MAX_CONTEXT_TOKENS;
};

const buildAIConversation = (history, chat) => {
	const aiOptions = resolveAIOptions(chat);

	const maxContextTokens = resolveContextTokenLimit(aiOptions.provider);

	return buildConversation(
		history,
		chat.summary?.content ?? "",
		maxContextTokens,
	);
};

const generateAssistantResponse = async (userId, chatId) => {
	const chat = await chatService.getChatById(chatId, userId);
	const history = await messageRepository.findMessagesByChat(chatId);
	const aiOptions = resolveAIOptions(chat);
	const conversation = buildAIConversation(history, chat);
	const startedAt = Date.now();

	// Persist the in-progress assistant message first so failures and cancellations remain visible.
	let assistantMessage = await messageRepository.createMessage({
		chat: chatId,
		user: userId,
		role: MESSAGE_ROLES.ASSISTANT,
		content: "",
		provider: aiOptions.provider,
		model: aiOptions.model,
		status: MESSAGE_STATUS.GENERATING,
		tokenUsage: {
			prompt: 0,
			completion: 0,
			total: 0,
		},
		metadata: {
			finishReason: null,
			latency: null,
		},
	});

	await chatService.updateChatActivity(
		chatId,
		assistantMessage._id,
		assistantMessage.createdAt,
	);

	try {
		const aiResponse = await aiService.generateResponse(
			conversation,
			aiOptions,
		);
		const latency = Date.now() - startedAt;

		assistantMessage = await messageRepository.updateMessageStatus(
			assistantMessage._id,
			MESSAGE_STATUS.COMPLETED,
			{
				content: aiResponse.content,
				tokenUsage: aiResponse.usage,
				"metadata.finishReason": aiResponse.finishReason,
				"metadata.latency": latency,
			},
		);

		await chatService.incrementTokenUsage(chatId, aiResponse.usage);

		const firstUserMessage = history.find(
			(message) => message.role === MESSAGE_ROLES.USER,
		);

		if (firstUserMessage) {
			await chatService.updateChatTitle(chatId, firstUserMessage.content);
		}

		triggerConversationSummary(chatId, aiOptions);

		return assistantMessage;
	} catch (error) {
		// Preserve the failed response record rather than losing the user's place in the conversation.
		await markMessageFailed(
			assistantMessage._id,
			error,
			Date.now() - startedAt,
		);

		throw error;
	}
};

// Keep the user message and generated response together inside the chat mutation lock.
const sendUserMessage = async (userId, chatId, content, attachments = []) => {
	return chatService.withChatMutationLock(chatId, async () => {
		const chat = await chatService.verifyChatAccess(chatId, userId);

		await verifyAttachmentsForChat(userId, chat, attachments);

		const userMessage = await messageRepository.createMessage({
			chat: chatId,
			user: userId,
			role: MESSAGE_ROLES.USER,
			content,
			attachments,
			status: MESSAGE_STATUS.COMPLETED,
		});

		await chatService.updateChatActivity(
			chatId,
			userMessage._id,
			userMessage.createdAt,
		);

		const assistantMessage = await generateAssistantResponse(userId, chatId);

		return {
			userMessage,
			assistantMessage,
		};
	});
};

// Regeneration is allowed only at the conversation tip to avoid creating hidden branches.
const regenerateResponse = async (userId, assistantMessageId) => {
	const existingMessage = await getMessageById(userId, assistantMessageId);

	return chatService.withChatMutationLock(existingMessage.chat, async () => {
		const assistantMessage = await getMessageById(userId, assistantMessageId);

		if (assistantMessage.role !== MESSAGE_ROLES.ASSISTANT) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Only assistant messages can be regenerated.",
			);
		}

		const lastMessage = await messageRepository.findLastMessageByChat(
			assistantMessage.chat,
		);

		if (
			!lastMessage ||
			lastMessage._id.toString() !== assistantMessage._id.toString()
		) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Only the latest assistant response can be regenerated.",
			);
		}

		const userMessage = await messageRepository.findPreviousUserMessage(
			assistantMessage.chat,
			assistantMessage.createdAt,
			assistantMessage._id,
		);

		if (!userMessage) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Previous user message not found.",
			);
		}

		await messageRepository.deleteMessage(assistantMessage._id);

		const newAssistantMessage = await generateAssistantResponse(
			userId,
			assistantMessage.chat,
		);

		await syncChatMessageStats(assistantMessage.chat);

		return {
			userMessage,
			assistantMessage: newAssistantMessage,
		};
	});
};

// Editing an earlier user message invalidates every response that followed it.
const editMessage = async (userId, messageId, content, attachments = []) => {
	const existingMessage = await getMessageById(userId, messageId);

	return chatService.withChatMutationLock(existingMessage.chat, async () => {
		const userMessage = await getMessageById(userId, messageId);

		if (userMessage.role !== MESSAGE_ROLES.USER) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Only user messages can be edited.",
			);
		}

		const chat = await chatService.getChatById(userMessage.chat, userId);

		await verifyAttachmentsForChat(userId, chat, attachments);

		await messageRepository.updateMessage(messageId, {
			content,
			attachments,
		});

		// Remove the old branch before generating the replacement assistant response.
		await messageRepository.deleteMessagesAfter(
			userMessage.chat,
			userMessage.createdAt,
			userMessage._id,
		);

		const assistantMessage = await generateAssistantResponse(
			userId,
			userMessage.chat,
		);

		await syncChatMessageStats(userMessage.chat);

		return {
			userMessage: await messageRepository.findMessageById(messageId),
			assistantMessage,
		};
	});
};

const generateAssistantStream = async (
	userId,
	chatId,
	callbacks = {},
	signal = null,
	options = {},
) => {
	const {
		onToken = () => {},
		onComplete = () => {},
		onError = () => {},
	} = callbacks;

	const { contentForTitle = null } = options;

	let assistantMessage = null;
	let assistantText = "";
	const startedAt = Date.now();

	try {
		// Authorize before reading history or reserving a new assistant message.
		const chat = await chatService.verifyChatAccess(chatId, userId);

		const provider = chat.provider ?? DEFAULT_PROVIDER;

		const model = chat.model ?? DEFAULT_MODEL;

		const systemPrompt = chat.systemPrompt ?? undefined;

		const aiOptions = {
			provider,
			model,
			systemPrompt,
			signal,
		};

		const maxContextTokens =
			provider === AI_PROVIDERS.GROQ
				? AI_CONTEXT.GROQ_CONTEXT_TOKENS
				: AI_CONTEXT.MAX_CONTEXT_TOKENS;

		let history = await messageRepository.findMessagesByChat(chatId);

		// Do not feed the failed/cancelled attempt back to the provider during a retry.
		if (options.excludeMessageId) {
			history = history.filter(
				(message) =>
					message._id.toString() !== options.excludeMessageId.toString(),
			);
		}

		const conversation = buildConversation(
			history,
			chat.summary?.content ?? "",
			maxContextTokens,
		);

		// Persist the generating state before streaming tokens to the client.
		assistantMessage = await messageRepository.createMessage({
			chat: chatId,
			user: userId,
			role: MESSAGE_ROLES.ASSISTANT,
			content: "",
			provider,
			model,
			status: MESSAGE_STATUS.GENERATING,
			tokenUsage: {
				prompt: 0,
				completion: 0,
				total: 0,
			},
			metadata: {
				finishReason: null,
				latency: null,
				safety: null,
			},
		});

		await chatService.updateChatActivity(
			chatId,
			assistantMessage._id,
			assistantMessage.createdAt,
		);

		const stream = await aiService.generateStream(conversation, aiOptions);

		// Provider adapters normalize chunks into token, completion, and error events.
		let finishReason = null;
		let usage = null;

		for await (const event of stream) {
			if (event.type === "token") {
				if (signal?.aborted) {
					throw new AICancelledError();
				}

				const text = event.content;

				if (!text) {
					continue;
				}

				assistantText += text;

				await onToken(text);

				continue;
			}

			if (event.type === "done") {
				finishReason = event.finishReason ?? null;

				usage = event.usage ?? null;

				continue;
			}

			if (event.type === "error") {
				throw new Error(
					event.error?.message ?? event.error ?? "AI stream failed",
				);
			}
		}

		// A stream may finish just as its HTTP connection is aborted.
		if (signal?.aborted) {
			throw new AICancelledError();
		}

		const tokenUsage = normalizeTokenUsage(usage);

		const latency = Date.now() - startedAt;

		// Commit the full response only after the provider signals completion.
		assistantMessage = await messageRepository.updateMessageStatus(
			assistantMessage._id,
			MESSAGE_STATUS.COMPLETED,
			{
				content: assistantText,
				tokenUsage,
				"metadata.finishReason": finishReason,
				"metadata.latency": latency,
			},
		);

		await chatService.incrementTokenUsage(chatId, tokenUsage);

		triggerConversationSummary(chatId, aiOptions);

		if (contentForTitle) {
			await chatService.updateChatTitle(chatId, contentForTitle);
		}

		await onComplete({
			assistantMessage,
		});

		return assistantMessage;
	} catch (error) {
		const latency = Date.now() - startedAt;

		// Keep partial text when cancelled so the user can see what was generated before stopping.
		if (error instanceof AICancelledError || signal?.aborted) {
			if (assistantMessage?._id) {
				assistantMessage = await messageRepository.updateMessageStatus(
					assistantMessage._id,
					MESSAGE_STATUS.CANCELLED,
					{
						content: assistantText,
						"metadata.finishReason": "cancelled",
						"metadata.latency": latency,
						"metadata.error": {
							code: "AI_GENERATION_CANCELLED",
							message: "AI generation was cancelled.",
							retryable: false,
						},
					},
				);
			}

			if (!signal?.aborted) {
				await onError(error);
			}

			throw error;
		}

		if (assistantMessage?._id) {
			const normalizedError = {
				code: error.code ?? "AI_GENERATION_FAILED",

				message: error.message ?? "AI generation failed.",

				retryable: error.retryable ?? false,
			};

			assistantMessage = await messageRepository.updateMessageStatus(
				assistantMessage._id,
				MESSAGE_STATUS.FAILED,
				{
					content: assistantText,
					"metadata.finishReason": "error",
					"metadata.latency": latency,
					"metadata.error": normalizedError,
				},
			);
		}

		await onError(error);

		throw error;
	}
};

// Create the user message before opening the stream so it survives a client disconnect.
const streamMessage = async (
	userId,
	chatId,
	content,
	callbacks = {},
	attachments = [],
	signal = null,
) => {
	return chatService.withChatMutationLock(chatId, async () => {
		const chat = await chatService.verifyChatAccess(chatId, userId);

		await verifyAttachmentsForChat(userId, chat, attachments);

		const userMessage = await messageRepository.createMessage({
			chat: chatId,
			user: userId,
			role: MESSAGE_ROLES.USER,
			content,
			attachments,
			status: MESSAGE_STATUS.COMPLETED,
		});

		await chatService.updateChatActivity(
			chatId,
			userMessage._id,
			userMessage.createdAt,
		);

		return generateAssistantStream(
			userId,
			chatId,
			{
				...callbacks,
				onComplete: async ({ assistantMessage }) => {
					await callbacks.onComplete?.({
						assistantMessage,
						userMessage,
					});
				},
			},
			signal,
			{
				contentForTitle: content,
			},
		);
	});
};

// Retrying keeps the original failed message as history but excludes it from the new prompt.
const retryStreamMessage = async (
	userId,
	assistantMessageId,
	callbacks = {},
	signal = null,
) => {
	const existingMessage = await getMessageById(userId, assistantMessageId);

	return chatService.withChatMutationLock(existingMessage.chat, async () => {
		const assistantMessage = await getMessageById(userId, assistantMessageId);

		if (assistantMessage.role !== MESSAGE_ROLES.ASSISTANT) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Only assistant messages can be retried.",
			);
		}

		if (
			assistantMessage.status !== MESSAGE_STATUS.FAILED &&
			assistantMessage.status !== MESSAGE_STATUS.CANCELLED
		) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Only failed or cancelled assistant messages can be retried.",
			);
		}

		const lastMessage = await messageRepository.findLastMessageByChat(
			assistantMessage.chat,
		);

		if (
			!lastMessage ||
			lastMessage._id.toString() !== assistantMessage._id.toString()
		) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Only the latest assistant response can be retried.",
			);
		}

		const userMessage = await messageRepository.findPreviousUserMessage(
			assistantMessage.chat,
			assistantMessage.createdAt,
			assistantMessage._id,
		);

		if (!userMessage) {
			throw new ApiError(
				HTTP_STATUS.BAD_REQUEST,
				"Previous user message not found.",
			);
		}

		const newAssistantMessage = await generateAssistantStream(
			userId,
			assistantMessage.chat,
			callbacks,
			signal,
			{
				excludeMessageId: assistantMessage._id,
			},
		);

		return {
			userMessage,
			assistantMessage: newAssistantMessage,
		};
	});
};

const getMessagesByChat = async (userId, chatId) => {
	await chatService.verifyChatAccess(chatId, userId);

	return messageRepository.findMessagesByChat(chatId);
};

const getMessageById = async (userId, messageId) => {
	const message = await messageRepository.findMessageById(messageId);

	if (!message) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "Message not found.");
	}

	await chatService.verifyChatAccess(message.chat, userId);

	return message;
};

const deleteMessage = async (userId, messageId) => {
	const existingMessage = await getMessageById(userId, messageId);

	return chatService.withChatMutationLock(existingMessage.chat, async () => {
		const message = await getMessageById(userId, messageId);
		const deletedMessage = await messageRepository.deleteMessage(messageId);

		if (deletedMessage) {
			await syncChatMessageStats(message.chat);
		}

		return deletedMessage;
	});
};

const generateConversationSummary = async (chatId, aiOptions = {}) => {
	const chat = await chatRepository.findById(chatId);

	if (!chat) {
		throw new ApiError(HTTP_STATUS.NOT_FOUND, "Chat not found.");
	}

	// Capture the source state so a stale summary cannot replace newer history.
	const history = await messageRepository.findMessagesByChat(chatId);
	const sourceMessageCount = history.length;
	const sourceLastMessageId = history.at(-1)?._id?.toString() ?? null;

	// Generate outside a transaction, then verify history was unchanged before saving the result.
	const summaryResponse = await summaryService.summarizeConversation(history, {
		provider: aiOptions.provider ?? chat.provider ?? DEFAULT_PROVIDER,

		model: aiOptions.model ?? chat.model ?? DEFAULT_MODEL,
	});

	const updatedChat = await chatService.incrementTokenUsage(
		chatId,
		summaryResponse.usage,
	);

	const [currentMessageCount, currentLastMessage] = await Promise.all([
		messageRepository.countMessagesByChat(chatId),
		messageRepository.findLatestMessageByChat(chatId),
	]);

	if (
		currentMessageCount !== sourceMessageCount ||
		currentLastMessage?._id?.toString() !== sourceLastMessageId
	) {
		// A newer message arrived while summarizing, so this summary is already stale.
		return null;
	}

	// Save the chat usage checkpoint that this summary represents.
	await chatService.updateSummary(
		chatId,
		summaryResponse.content,
		updatedChat?.tokenUsage?.total ?? chat.tokenUsage?.total ?? 0,
	);

	return summaryResponse.content;
};

const triggerConversationSummary = (chatId, aiOptions) => {
	const key = getChatKey(chatId);

	if (activeSummaryGenerations.has(key)) {
		return;
	}

	activeSummaryGenerations.add(key);

	void (async () => {
		const shouldSummarize = await chatService.shouldGenerateSummary(chatId);

		if (shouldSummarize) {
			await generateConversationSummary(chatId, aiOptions);
		}
	})()
		.catch(() => {
			console.error("Conversation summary generation failed.");
		})
		.finally(() => {
			activeSummaryGenerations.delete(key);
		});
};

const markMessageCompleted = async (messageId, data = {}) => {
	return messageRepository.updateMessageStatus(
		messageId,
		MESSAGE_STATUS.COMPLETED,
		data,
	);
};

const markMessageFailed = async (messageId, error, latency = null) => {
	return messageRepository.updateMessageStatus(
		messageId,
		MESSAGE_STATUS.FAILED,
		{
			"metadata.finishReason": "error",

			"metadata.latency": latency,

			"metadata.error": {
				code: error?.code ?? "AI_GENERATION_FAILED",
				message: error?.message ?? "AI generation failed.",
				retryable: error?.retryable ?? false,
			},
		},
	);
};

const markMessageCancelled = async (
	messageId,
	latency = null,
	partialContent = "",
) => {
	return messageRepository.updateMessageStatus(
		messageId,
		MESSAGE_STATUS.CANCELLED,
		{
			content: partialContent,

			"metadata.finishReason": "cancelled",

			"metadata.latency": latency,

			"metadata.error": {
				code: "AI_GENERATION_CANCELLED",
				message: "AI generation was cancelled.",
				retryable: false,
			},
		},
	);
};

const syncChatMessageStats = async (chatId) => {
	const [messageCount, lastMessage] = await Promise.all([
		messageRepository.countMessagesByChat(chatId),
		messageRepository.findLatestMessageByChat(chatId),
	]);

	return chatRepository.syncMessageStats(
		chatId,
		messageCount,
		lastMessage?._id ?? null,
		lastMessage?.createdAt ?? null,
	);
};

export const messageService = {
	sendUserMessage,
	regenerateResponse,
	editMessage,
	streamMessage,
	retryStreamMessage,
	getMessagesByChat,
	getMessageById,
	deleteMessage,
	generateConversationSummary,

	markMessageCompleted,
	markMessageFailed,
	markMessageCancelled,
};
