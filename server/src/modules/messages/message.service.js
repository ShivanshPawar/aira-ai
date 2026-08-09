import { chatService } from "../chat/chat.service.js";
import { messageRepository } from "./message.repository.js";
import { MESSAGE_ROLES } from "../../shared/constants/message.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { aiService } from "../ai/ai.service.js";
import {
    AI_CONTEXT,
    AI_PROVIDERS,
    DEFAULT_MODEL,
    DEFAULT_PROVIDER,
} from "../ai/ai.constants.js";
import { buildConversation } from "../ai/conversation.builder.js";
import { summaryService } from "../ai/services/summary.service.js";


const generateAssistantResponse = async (
    userId,
    chatId
) => {

    const chat = await chatService.getChatById(chatId, userId);

    const history = await messageRepository.findMessagesByChat(chatId);

    const aiOptions = {
        provider: chat.provider ?? DEFAULT_PROVIDER,
        model: chat.model ?? DEFAULT_MODEL,
        systemPrompt: chat.systemPrompt ?? undefined,
    };

    const maxContextTokens =
        aiOptions.provider === AI_PROVIDERS.GROQ
            ? AI_CONTEXT.GROQ_CONTEXT_TOKENS
            : AI_CONTEXT.MAX_CONTEXT_TOKENS;

    const conversation = buildConversation(
        history,
        chat.summary?.content ?? "",
        maxContextTokens
    );

    const aiResponse = await aiService.generateResponse(conversation, aiOptions);

    const assistantMessage = await messageRepository.createMessage({

        chat: chatId,

        user: userId,

        role: MESSAGE_ROLES.ASSISTANT,

        content: aiResponse.content,

        provider: aiOptions.provider,

        model: aiOptions.model,

        tokenUsage: aiResponse.usage,

        metadata: {
            finishReason:
                aiResponse.finishReason,
        },

    });

    await chatService.updateChatActivity(
        chatId,
        assistantMessage._id
    );

    await chatService.incrementTokenUsage(
        chatId,
        aiResponse.usage
    );

    const shouldSummarize = await chatService.shouldGenerateSummary(
        chatId
    );

    if (shouldSummarize) {

        generateConversationSummary(chatId, aiOptions).catch((error) => {
            console.error(
                "Failed to generate conversation summary",
                error
            );
        });

    }

    return assistantMessage;
};

const sendUserMessage = async (
    userId,
    chatId,
    content,
    attachments = []
) => {

    await chatService.verifyChatAccess(
        chatId,
        userId
    );

    const userMessage = await messageRepository.createMessage({

        chat: chatId,

        user: userId,

        role: MESSAGE_ROLES.USER,

        content,

        attachments,

    });

    const assistantMessage = await generateAssistantResponse(
        userId,
        chatId
    );

    return {
        userMessage,
        assistantMessage,
    };

};

const regenerateResponse = async (
    userId,
    assistantMessageId
) => {

    const assistantMessage = await getMessageById(
        userId,
        assistantMessageId
    );

    if (
        assistantMessage.role !== MESSAGE_ROLES.ASSISTANT
    ) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only assistant messages can be regenerated."
        );
    }

    const lastMessage = await messageRepository.findLastMessageByChat(
        assistantMessage.chat
    );

    if (
        lastMessage._id.toString() !== assistantMessage._id.toString()
    ) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only the latest assistant response can be regenerated."
        );
    }

    const userMessage = await messageRepository.findPreviousUserMessage(
        assistantMessage.chat,
        assistantMessage.createdAt
    );

    if (!userMessage) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Previous user message not found."
        );
    }

    await messageRepository.deleteMessage(
        assistantMessage._id
    );

    await chatService.updateChatActivity(
        assistantMessage.chat,
        userMessage._id
    );

    const newAssistantMessage = await generateAssistantResponse(
        userId,
        assistantMessage.chat
    );

    return {
        userMessage,
        assistantMessage: newAssistantMessage,
    };
};

const editMessage = async (
    userId,
    messageId,
    content,
    attachments = []
) => {

    const userMessage = await getMessageById(
        userId,
        messageId
    );

    if (userMessage.role !== MESSAGE_ROLES.USER) {
        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only user messages can be edited."
        );
    }

    await messageRepository.updateMessage(
        messageId,
        {
            content,
            attachments,
        }
    );

    await messageRepository.deleteMessagesAfter(
        userMessage.chat,
        userMessage.createdAt
    );

    await chatService.updateChatActivity(
        userMessage.chat,
        userMessage._id
    );

    const assistantMessage = await generateAssistantResponse(
        userId,
        userMessage.chat
    );

    return {
        userMessage: await messageRepository.findMessageById(messageId),
        assistantMessage,
    };
};


const streamMessage = async (
    userId,
    chatId,
    content,
    callbacks = {},
    attachments = []
) => {

    console.log("=== STREAM SERVICE ===");

    console.log({
        userId,
        chatId,
        content,
        attachments,
    });

    const {
        onToken = (text) => { },
        onComplete = ({ assistantMessage }) => { },
        onError = (error) => { },
    } = callbacks;

    try {

        const chat = await chatService.verifyChatAccess(chatId, userId);

        await messageRepository.createMessage({
            chat: chatId,
            user: userId,
            role: MESSAGE_ROLES.USER,
            content: content,
            attachments,
        });

        const history = await messageRepository.findMessagesByChat(chatId);

        const aiOptions = {
            provider: chat.provider ?? DEFAULT_PROVIDER,
            model: chat.model ?? DEFAULT_MODEL,
            systemPrompt: chat.systemPrompt ?? undefined,
        };

        const maxContextTokens =
            provider === AI_PROVIDERS.GROQ
                ? AI_CONTEXT.GROQ_CONTEXT_TOKENS
                : AI_CONTEXT.MAX_CONTEXT_TOKENS;

        const conversation = buildConversation(
            history,
            chat.summary?.content ?? "",
            maxContextTokens
        );

        const stream = await aiService.generateStream(
            conversation,
            {
                provider,
                model,
                systemPrompt: chat.systemPrompt ?? undefined,
            }
        );

        let assistantText = "";

        let finishReason = null;

        let usage = null;

        for await (const event of stream) {

            if (event.type === "token") {

                const text = event.content;

                if (!text) continue;

                assistantText += text;

                onToken(text);

                continue;
            }

            if (event.type === "done") {

                finishReason =
                    event.finishReason ?? null;

                usage =
                    event.usage ?? null;

                continue;
            }

            if (event.type === "error") {

                throw new Error(
                    event.error?.message ??
                    event.error ??
                    "AI stream failed"
                );
            }

        }

        const tokenUsage = {
            prompt:
                usage?.prompt ??
                usage?.prompt_tokens ??
                usage?.promptTokenCount ??
                0,
            completion:
                usage?.completion ??
                usage?.completion_tokens ??
                usage?.candidatesTokenCount ??
                0,
            total:
                usage?.total ??
                usage?.total_tokens ??
                usage?.totalTokenCount ??
                0,
        };

        const assistantMessage = await messageRepository.createMessage({
            chat: chatId,
            user: userId,
            role: MESSAGE_ROLES.ASSISTANT,

            content: assistantText,

            provider,
            model,

            tokenUsage,

            metadata: {
                finishReason,
            },
        });

        await chatService.incrementTokenUsage(chatId, tokenUsage);

        await chatService.updateChatActivity(chatId, assistantMessage._id);

        await chatService.updateChatTitle(chatId, content);

        await onComplete({ assistantMessage });

        return assistantMessage;

    } catch (error) {
        await onError(error);
        throw error;
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

const generateConversationSummary = async (
    chatId,
    aiOptions = {}
) => {

    const history = await messageRepository.findMessagesByChat(chatId);

    const summary = await summaryService.summarizeConversation(
        history,
        {
            provider: aiOptions.provider ?? DEFAULT_PROVIDER,
            model: aiOptions.model ?? DEFAULT_MODEL,
        }
    );

    await chatService.updateSummary(
        chatId,
        summary
    );

    return summary;

};

export const messageService = {
    sendUserMessage,
    regenerateResponse,
    editMessage,
    streamMessage,
    getMessagesbyChat,
    getMessageById,
    deleteMessage,
    generateConversationSummary
}
