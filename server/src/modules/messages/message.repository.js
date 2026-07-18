import { Message } from "./message.model.js";

const createMessage = async (messageData) => {
    return Message.create(messageData);
};

const findMessageById = async (messageId) => {
    return Message.findById(messageId);
};

const findMessagesByChat = async (chatId) => {
    return Message.find({ chat: chatId }).sort({ createdAt: 1 });
};

const updateMessage = async (messageId, data) => {
    return Message.findByIdAndUpdate(
        messageId,
        data,
        {
            new: true,
            runValidators: true,
        }
    );
};

const deleteMessage = async (messageId) => {
    return Message.findByIdAndDelete(messageId);
};

const updateChatActivity = async (chatId, lastMessageId) => {
    return Chat.findByIdAndUpdate(
        chatId,
        {
            lastMessageAt: lastMessageId,
            lastMessageAt: new Date(),
            $inc: {
                messageCount: 1,
            },
        }, {
        new: true,
    }
    );
};

export const messageRepository = {
    createMessage,
    findMessageById,
    findMessagesByChat,
    updateMessage,
    deleteMessage,
    updateChatActivity
};