import { Chat } from "./chat.model.js";

const create = async (chatData) => {
    return Chat.create(chatData);
};

const findById = async (chatId) => {
    return Chat.findById(chatId);
};

const findChats = async (
    filters,
    sort = {
        isPinned: -1,
        lastMessageAt: -1,
    }
) => {
    return Chat.find(filters).sort(sort);
};

const updateById = async (chatId, data) => {
    return Chat.findByIdAndUpdate(
        chatId,
        data,
        {
            new: true,
            runValidators: true,
        }
    );
};

const deleteById = async (chatId) => {
    return Chat.findByIdAndDelete(chatId);
};

const updateChatActivity = async (chatId, lastMessageId) => {
    return Chat.findByIdAndUpdate(
        chatId,
        {
            lastMessage: lastMessageId,
            lastMessageAt: new Date(),
            $inc: {
                messageCount: 1,
            },
        },
        {
            new: true,
        }
    );
};

export const chatRepository = {
    create,
    findById,
    findChats,
    updateById,
    deleteById,
    updateChatActivity,
};