import { MESSAGE_ROLES } from "../../shared/constants/message.js";
import { Message } from "./message.model.js";

const createMessage = async (messageData) => {
    return Message.create(messageData);
};

const findMessageById = async (messageId) => {
    return Message.findById(messageId).lean();
};

const findMessagesByChat = async (chatId) => {
    return Message.find({
        chat: chatId,
    })
        .populate("attachments")
        .sort({
            createdAt: 1,
        })
        .lean();
};

const findLastMessageByChat = async (chatId) => {
    return Message.findOne({
        chat: chatId,
    }).sort({
        createdAt: -1,
    })
        .lean();
};

const findPreviousUserMessage = async (
    chatId,
    assistantCreatedAt,
) => {

    return Message.findOne({
        chat: chatId,
        role: MESSAGE_ROLES.USER,

        createdAt: {
            $lt: assistantCreatedAt,
        },
    }).sort({
        createdAt: -1,
    })
        .lean();
};

const deleteMessagesAfter = async (
    chatId,
    createdAt
) => {

    return Message.deleteMany({
        chat: chatId,
        createdAt: {
            $gt: createdAt,
        },
    });

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

const updateMessageStatus = async (
    messageId,
    status,
    data = {}
) => {

    return Message.findByIdAndUpdate(
        messageId,
        {
            $set: {
                status,
                ...data,
            },
        },
        {
            returnDocument: "after",
            runValidators: true,
        }
    ).lean();
};

const countMessagesByChat = async (chatId) => {
    return Message.countDocuments({
        chat: chatId,
    });
};

const findLatestMessageByChat = async (chatId) => {
    return Message.findOne({
        chat: chatId,
    })
        .sort({
            createdAt: -1,
            _id: -1,
        })
        .lean();
};



export const messageRepository = {
    createMessage,
    findMessageById,
    findMessagesByChat,
    updateMessage,
    deleteMessage,
    findLastMessageByChat,
    findPreviousUserMessage,
    deleteMessagesAfter,
    updateMessageStatus,
    countMessagesByChat,
    findLatestMessageByChat,
};