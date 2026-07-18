import { Chat } from "./chat.model.js";

const create = async (chatData) => {
    return Chat.create(chatData);
};

const findById = async (chatId) => {
    return Chat.findById(chatId);
};

const findByUser = async (userId) => {
    return Chat.find({
        user: userId,
        isArchived: false,
    }).sort({
        lastMessageAt: -1,
    });
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
    findByUser,
    updateById,
    deleteById,
    updateChatActivity,
};