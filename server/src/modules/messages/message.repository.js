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
      _id: 1,
    })
    .lean();
};

const findLastMessageByChat = async (chatId) => {
  return Message.findOne({
    chat: chatId,
  })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .lean();
};

const findPreviousUserMessage = async (
  chatId,
  assistantCreatedAt,
  assistantMessageId,
) => {
  return Message.findOne({
    chat: chatId,
    role: MESSAGE_ROLES.USER,

    $or: [
      {
        createdAt: {
          $lt: assistantCreatedAt,
        },
      },
      {
        createdAt: assistantCreatedAt,
        _id: {
          $lt: assistantMessageId,
        },
      },
    ],
  })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .lean();
};

const deleteMessagesAfter = async (chatId, createdAt, messageId) => {
  return Message.deleteMany({
    chat: chatId,
    $or: [
      {
        createdAt: {
          $gt: createdAt,
        },
      },
      {
        createdAt,
        _id: {
          $gt: messageId,
        },
      },
    ],
  });
};

const updateMessage = async (messageId, data) => {
  return Message.findByIdAndUpdate(messageId, data, {
    returnDocument: "after",
    runValidators: true,
  });
};

const deleteMessage = async (messageId) => {
  return Message.findByIdAndDelete(messageId);
};

const deleteMessagesByChat = async (chatId) => {
  return Message.deleteMany({
    chat: chatId,
  });
};

const updateMessageStatus = async (messageId, status, data = {}) => {
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
    },
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
  deleteMessagesByChat,
  findLastMessageByChat,
  findPreviousUserMessage,
  deleteMessagesAfter,
  updateMessageStatus,
  countMessagesByChat,
  findLatestMessageByChat,
};
