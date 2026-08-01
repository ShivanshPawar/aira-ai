import { Message } from "./message.model.js";

const createMessage = async (messageData) => {
    return Message.create(messageData);
};

const findMessageById = async (messageId) => {
    return Message.findById(messageId);
};

const findMessagesByChat = async (chatId) => {
    return Message.find({
        chat: chatId,
    })
        .populate("attachments")
        .sort({
            createdAt: 1,
        });;
};

const updateMessage = async (messageId, data) => {
    return Message.findByIdAndUpdate(
        messageId,
        data,
        {
            returnDocument: "after",
            runValidators: true,
        }
    );
};

const deleteMessage = async (messageId) => {
    return Message.findByIdAndDelete(messageId);
};



export const messageRepository = {
    createMessage,
    findMessageById,
    findMessagesByChat,
    updateMessage,
    deleteMessage,
};