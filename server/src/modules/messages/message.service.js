import { chatService } from "../chat/chat.service.js";
import { messageRepository } from "./message.repository.js";
import { MESSAGE_ROLES } from "../../shared/constants/message.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";

const sendUserMessage = async (
    userId,
    chatId,
    content
) => {

    await chatService.verifyChatAccess(chatId, userId);

    const message = await messageRepository.createMessage({
        chat: chatId,
        user: userId,
        content,
        role: MESSAGE_ROLES.USER
    });

    await chatService.updateChatActivity(chatId, message._id);

    return message;
}

const getMessagesbyChat = async (userId, chatId) => {

    await chatService.verifyChatAccess(chatId, userId);

    return messageRepository.findMessagesByChat(chatId);
};

const getMessageById = async (userId, messageId) => {
    const message = await messageRepository.findMessageById(messageId);

    if (!message) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Message not found");
    };

    await chatService.verifyChatAccess(message.chat, userId);

    return message;
};

const deleteMessage = async (userId, messageId) => {
    const message = await getMessageById(userId, messageId);

    return messageRepository.deleteMessage(messageId);
};

export const messageService = {
    sendUserMessage,
    getMessagesbyChat,
    getMessageById,
    deleteMessage,
}