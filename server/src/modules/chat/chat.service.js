import { chatRepository } from "./chat.repository.js";
import { AI_MODELS, AI_PROVIDERS } from "./../../shared/constants/ai.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { generateChatTitle } from "../../shared/utils/titleGenerator.js";
import { QueryBuilder } from "../../shared/utils/queryBuilder.js";

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

const getChatsWithArchiveStatus = async (
    userId,
    query = {},
    isArchived = false
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
    return getChatsWithArchiveStatus(
        userId,
        query,
        false
    );
};

const getArchivedChats = (userId, query) => {
    return getChatsWithArchiveStatus(
        userId,
        query,
        true
    );
};

const getChatById = async (chatId, userId) => {
    return verifyChatAccess(chatId, userId);
}


const updateChat = async (chatId, userId, updates) => {

    await verifyChatAccess(chatId, userId);

    const updatedChat = await chatRepository.updateById(
        chatId,
        updates
    );

    if (!updatedChat) {
        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            "Chat not found."
        );
    }

    return updatedChat;

}

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

const updateChatTitle = async (chatId, firstMessage) => {

    const chat = await chatRepository.findById(chatId);

    if (!chat) return;

    if (chat.title !== "Untitled") {
        return;
    }

    const title = generateChatTitle(firstMessage);

    await chatRepository.updateById(chatId, { title });

}

const renameChat = async (chatId, userId, title) => {

    return updateChat(chatId, userId, { title });

}

const togglePin = async (chatId, userId) => {

    const chat = await verifyChatAccess(chatId, userId);

    return updateChat(chatId, userId, {
        isPinned: !chat.isPinned
    });

}

const toggleArchive = async (chatId, userId) => {
    const chat = await verifyChatAccess(chatId, userId);

    return updateChat(chatId, userId, {
        isArchived: !chat.isArchived,
    })
}

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
}