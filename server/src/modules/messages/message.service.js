import { chatService } from "../chat/chat.service.js";
import { messageRepository } from "./message.repository.js";
import { MESSAGE_ROLES } from "../../shared/constants/message.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { aiService } from "../ai/ai.service.js";
// import { chatService } from './../chat/chat.service.js';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "../ai/ai.constants.js";
import { buildConversationPrompt } from "../ai/prompt.builder.js";

const sendUserMessage = async (
    userId,
    chatId,
    content
) => {

    await chatService.verifyChatAccess(chatId, userId);

    const userMessage = await messageRepository.createMessage({
        chat: chatId,
        user: userId,
        content,
        role: MESSAGE_ROLES.USER
    });

    const history = await messageRepository.findMessagesByChat(chatId)

    const prompt = buildConversationPrompt(history);

    const aiResponse = await aiService.generateResponse(prompt)

    const assistantMessage = await messageRepository.createMessage({
        chat: chatId,
        user: userId,
        role: MESSAGE_ROLES.ASSISTANT,
        content: aiResponse.content,
        provider: DEFAULT_PROVIDER,
        model: DEFAULT_MODEL,
        tokenUsage: aiResponse.usage,
        metadata: {
            finishReason: aiResponse.finishReason,
        },
    });

    await chatService.updateChatActivity(chatId, assistantMessage._id);

    return {
        userMessage,
        assistantMessage
    }
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