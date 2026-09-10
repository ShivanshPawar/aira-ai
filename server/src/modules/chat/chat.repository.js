import { Chat } from "./chat.model.js";

const create = async (chatData) => {
	return Chat.create(chatData);
};

const findById = async (chatId) => {
	return Chat.findById(chatId);
};

const findChats = async ({ filters, sort, skip, limit }) => {
	return Chat.find(filters).sort(sort).skip(skip).limit(limit).lean();
};

const countChats = async (filters) => {
	return Chat.countDocuments(filters);
};

const updateById = async (chatId, data) => {
	return Chat.findByIdAndUpdate(chatId, data, {
		returnDocument: "after",
		runValidators: true,
	});
};

const deleteById = async (chatId) => {
	return Chat.findByIdAndDelete(chatId);
};

const updateChatActivity = async (chatId, lastMessageId, lastMessageAt) => {
	return Chat.findByIdAndUpdate(
		chatId,
		{
			lastMessage: lastMessageId,
			lastMessageAt,

			$inc: {
				messageCount: 1,
			},
		},
		{
			returnDocument: "after",
		},
	);
};

const incrementTokenUsage = async (chatId, usage) => {
	return Chat.findByIdAndUpdate(
		chatId,
		{
			$inc: {
				"tokenUsage.prompt": usage.prompt ?? 0,
				"tokenUsage.completion": usage.completion ?? 0,
				"tokenUsage.total": usage.total ?? 0,
			},
		},
		{
			returnDocument: "after",
		},
	);
};

const updateSummary = async (chatId, summary, tokenUsage) => {
	return Chat.findByIdAndUpdate(
		chatId,
		{
			summary: {
				content: summary,
				updatedAt: new Date(),
				tokenUsage,
			},
		},
		{
			returnDocument: "after",
		},
	);
};

const syncMessageStats = async (
	chatId,
	messageCount,
	lastMessage,
	lastMessageAt,
) => {
	return Chat.findByIdAndUpdate(
		chatId,
		{
			messageCount,
			lastMessage,
			lastMessageAt,
		},
		{
			returnDocument: "after",
		},
	);
};

export const chatRepository = {
	create,
	findById,
	findChats,
	countChats,
	updateById,
	deleteById,
	updateChatActivity,
	incrementTokenUsage,
	updateSummary,
	syncMessageStats,
};
