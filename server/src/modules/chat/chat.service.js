import { chatRepository } from "./chat.repository.js";
import { AI_MODELS, AI_PROVIDERS } from "./../../shared/constants/ai.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";

const createChat = async (userId, data) => {

    const provider = data.provider || AI_PROVIDERS.GEMINI;
    let model = data.model;

    if (!model) {
        model = provider === AI_PROVIDERS.GEMINI ? AI_MODELS.GEMINI_FLASH : AI_MODELS.LLAMA_3_3_70B_VERSATILE;
    }

    return chatRepository.create({
        user: userId,
        title: "Untitled",
        provider,
        model,
    })

};

const getChats = async (userId) => {
    return chatRepository.findByUser(userId);
};

const getChatById = async (chatId, userId) => {
    return verifyChatAccess(chatId, userId);
}

const updateChat = async (
    chatId,
    userId,
    updateData
) => {

    await verifyChatAccess(chatId, userId);

    return chatRepository.updateById(
        chatId,
        updateData
    )

};

const deleteChat = async (chatId, userId) => {

    await getChatById(chatId, userId);

    return chatRepository.deleteById(chatId);
}

const verifyChatAccess = async (chatId, userId) => {

    const chat = await chatRepository.findById(chatId);

    if (!chat) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            "Chat not found."
        );
    }

    if (chat.user.toString() !== userId.toString()) {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            "You don't have access to this chat."
        );
    }

    return chat;
};

const updateChatActivity = async (chatId, messageId) => {
    return chatRepository.updateChatActivity(chatId, messageId);
};

export const chatService = {
    createChat,
    getChats,
    getChatById,
    updateChat,
    deleteChat,
    verifyChatAccess,
    updateChatActivity,
}