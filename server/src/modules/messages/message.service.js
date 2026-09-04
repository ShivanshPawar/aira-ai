import { chatService } from "../chat/chat.service.js";
import { messageRepository } from "./message.repository.js";
import { MESSAGE_ROLES, MESSAGE_STATUS } from "../../shared/constants/message.js";
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
import { chatRepository } from "../chat/chat.repository.js";
import { AICancelledError } from "../ai/errors/ai-cancelled.error.js";


// Helpers
const resolveAIOptions = (chat) => {

    const provider = chat.provider ?? DEFAULT_PROVIDER;

    const model = chat.model ?? DEFAULT_MODEL;

    const systemPrompt = chat.systemPrompt ?? undefined;

    return {
        provider,
        model,
        systemPrompt,
    };
};

// Helpers
const resolveContextTokenLimit = (provider) => {

    return provider === AI_PROVIDERS.GROQ
        ? AI_CONTEXT.GROQ_CONTEXT_TOKENS
        : AI_CONTEXT.MAX_CONTEXT_TOKENS;

};

// Helpers
const buildAIConversation = (
    history,
    chat
) => {

    const aiOptions = resolveAIOptions(chat);

    const maxContextTokens = resolveContextTokenLimit(
        aiOptions.provider
    );

    return buildConversation(
        history,
        chat.summary?.content ?? "",
        maxContextTokens
    );
};


// Generate Assistant Response
const generateAssistantResponse = async (
    userId,
    chatId
) => {

    // Verify chat access
    const chat = await chatService.getChatById(
        chatId,
        userId
    );


    // Get conversation history
    const history = await messageRepository.findMessagesByChat(
        chatId
    );

    // Resolve AI configuration
    const aiOptions = resolveAIOptions(chat);

    // Build conversation context
    const conversation = buildAIConversation(
        history,
        chat
    );

    // Generate AI response
    const aiResponse = await aiService.generateResponse(
        conversation,
        aiOptions
    );


    // Save assistant message
    const assistantMessage = await messageRepository.createMessage({
        chat: chatId,
        user: userId,
        role: MESSAGE_ROLES.ASSISTANT,
        content: aiResponse.content,
        provider: aiOptions.provider,
        model: aiOptions.model,
        status: MESSAGE_STATUS.COMPLETED,
        tokenUsage: aiResponse.usage,
        metadata: {
            finishReason: aiResponse.finishReason,
        },
    });


    // Update chat activity
    await chatService.updateChatActivity(
        chatId,
        assistantMessage._id
    );


    // Update token usage
    await chatService.incrementTokenUsage(
        chatId,
        aiResponse.usage
    );


    // Update chat title
    const firstUserMessage = history.find(
        (message) => message.role === MESSAGE_ROLES.USER
    );

    if (firstUserMessage) {

        await chatService.updateChatTitle(
            chatId,
            firstUserMessage.content
        );

    }


    // Check summary threshold
    const shouldSummarize = await chatService.shouldGenerateSummary(
        chatId
    );


    if (shouldSummarize) {

        generateConversationSummary(
            chatId,
            aiOptions
        ).catch((error) => {

            console.error(
                "Failed to generate conversation summary:",
                error
            );

        });

    }


    return assistantMessage;

};


// Send User Message
const sendUserMessage = async (
    userId,
    chatId,
    content,
    attachments = []
) => {

    // Verify chat access
    await chatService.verifyChatAccess(
        chatId,
        userId
    );


    // Save user message
    const userMessage = await messageRepository.createMessage({
        chat: chatId,
        user: userId,
        role: MESSAGE_ROLES.USER,
        content,
        attachments,
        status: MESSAGE_STATUS.COMPLETED,
    });


    // Update activity for user message
    await chatService.updateChatActivity(
        chatId,
        userMessage._id
    );

    // Generate assistant response
    const assistantMessage = await generateAssistantResponse(
        userId,
        chatId
    );


    return {

        userMessage,
        assistantMessage,

    };

};


// Regenerate Assistant Response
const regenerateResponse = async (
    userId,
    assistantMessageId
) => {

    // Get assistant message

    const assistantMessage = await getMessageById(
        userId,
        assistantMessageId
    );


    // Validate role
    if (assistantMessage.role !== MESSAGE_ROLES.ASSISTANT) {

        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only assistant messages can be regenerated."
        );

    }


    // Ensure latest message
    const lastMessage = await messageRepository.findLastMessageByChat(
        assistantMessage.chat
    );


    if (!lastMessage || lastMessage._id.toString() !== assistantMessage._id.toString()) {

        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only the latest assistant response can be regenerated."
        );

    }


    // Find previous user message
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


    // Remove old assistant response
    await messageRepository.deleteMessage(assistantMessage._id);


    // Generate new response

    const newAssistantMessage = await generateAssistantResponse(
        userId,
        assistantMessage.chat
    );


    return {

        userMessage,
        assistantMessage: newAssistantMessage,

    };

};


// Edit User Message
const editMessage = async (
    userId,
    messageId,
    content,
    attachments = []
) => {

    // Get message
    const userMessage = await getMessageById(
        userId,
        messageId
    );


    // Validate role
    if (userMessage.role !== MESSAGE_ROLES.USER) {

        throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            "Only user messages can be edited."
        );

    }


    // Update message
    await messageRepository.updateMessage(
        messageId,
        {
            content,
            attachments,
        }
    );


    // Remove all following messages
    await messageRepository.deleteMessagesAfter(
        userMessage.chat,
        userMessage.createdAt
    );


    // Update activity
    await chatService.updateChatActivity(
        userMessage.chat,
        userMessage._id
    );


    // Generate new assistant response
    const assistantMessage = await generateAssistantResponse(
        userId,
        userMessage.chat
    );


    return {

        userMessage: await messageRepository.findMessageById(
            messageId
        ),

        assistantMessage,

    };

};


// Stream Message
const streamMessage = async (
    userId,
    chatId,
    content,
    callbacks = {},
    attachments = [],
    signal = null
) => {
    const {
        onToken = () => { },
        onComplete = () => { },
        onError = () => { },
    } = callbacks;

    let assistantMessage = null;
    let assistantText = "";
    const startedAt = Date.now();

    try {
        //  Verify chat access
        const chat = await chatService.verifyChatAccess(
            chatId,
            userId
        );

        // Save USER message
        const userMessage = await messageRepository.createMessage({
            chat: chatId,
            user: userId,
            role: MESSAGE_ROLES.USER,
            content,
            attachments,
            status: MESSAGE_STATUS.COMPLETED,
        });

        // Resolve AI configuration
        const provider = chat.provider ?? DEFAULT_PROVIDER;
        const model = chat.model ?? DEFAULT_MODEL;
        const systemPrompt = chat.systemPrompt ?? undefined;

        const aiOptions = {
            provider,
            model,
            systemPrompt,
            signal,
        };

        // Resolve context window
        const maxContextTokens =
            provider === AI_PROVIDERS.GROQ
                ? AI_CONTEXT.GROQ_CONTEXT_TOKENS
                : AI_CONTEXT.MAX_CONTEXT_TOKENS;

        // Get conversation history
        const history = await messageRepository.findMessagesByChat(chatId);

        // Build AI conversation
        const conversation = buildConversation(
            history,
            chat.summary?.content ?? "",
            maxContextTokens
        );

        // Create ASSISTANT message first
        assistantMessage = await messageRepository.createMessage({
            chat: chatId,
            user: userId,
            role: MESSAGE_ROLES.ASSISTANT,
            content: "",
            provider,
            model,
            status: MESSAGE_STATUS.GENERATING,
            tokenUsage: {
                prompt: 0,
                completion: 0,
                total: 0,
            },
            metadata: {
                finishReason: null,
                latency: null,
                safety: null,
            },
        });

        // Start AI stream
        const stream = await aiService.generateStream(
            conversation,
            aiOptions
        );

        // Consume normalized stream
        let finishReason = null;
        let usage = null;

        for await (const event of stream) {

            // TOKEN
            if (event.type === "token") {

                if (signal?.aborted) {
                    throw new AICancelledError();
                }

                const text = event.content;

                if (!text) {
                    continue;
                }

                assistantText += text;

                await onToken(text);

                continue;
            }

            // DONE
            if (event.type === "done") {

                finishReason = event.finishReason ?? null;

                usage = event.usage ?? null;

                continue;
            }

            // ERROR EVENT
            if (event.type === "error") {

                throw new Error(
                    event.error?.message ??
                    event.error ??
                    "AI stream failed"
                );
            }
        }

        // IMPORTANT:
        // Stream may finish after the client has
        // already cancelled.

        if (signal?.aborted) {
            throw new AICancelledError();
        }

        // 10. Normalize token usage
        const tokenUsage = {
            prompt: usage?.prompt ?? 0,
            completion: usage?.completion ?? 0,
            total: usage?.total ?? 0,
        };

        // Calculate latency
        const latency = Date.now() - startedAt;

        // Mark assistant COMPLETED
        assistantMessage =
            await messageRepository.updateMessage(
                assistantMessage._id,
                {
                    content: assistantText,

                    status: MESSAGE_STATUS.COMPLETED,

                    tokenUsage,

                    metadata: {
                        finishReason,
                        latency,
                    },
                }
            );

        // Update chat token usage
        await chatService.incrementTokenUsage(
            chatId,
            tokenUsage
        );

        // Update chat activity
        await chatService.updateChatActivity(
            chatId,
            assistantMessage._id
        );

        // Update chat title
        await chatService.updateChatTitle(
            chatId,
            content
        );

        // Notify controller
        await onComplete({
            assistantMessage,
            userMessage,
        });

        // Return assistant message
        return assistantMessage;

    } catch (error) {

        const latency = Date.now() - startedAt;

        // CANCELLATION

        if (
            error instanceof AICancelledError ||
            signal?.aborted
        ) {

            if (assistantMessage?._id) {

                assistantMessage =
                    await messageRepository.updateMessage(
                        assistantMessage._id,
                        {
                            content: assistantText,

                            status: MESSAGE_STATUS.CANCELLED,

                            metadata: {
                                finishReason: "cancelled",
                                latency,
                                error: {
                                    code: "AI_GENERATION_CANCELLED",
                                    message:
                                        "AI generation was cancelled.",
                                    retryable: false,
                                },
                            },
                        }
                    );
            }

            // Do not send a normal SSE error after
            // the client has disconnected.
            if (!signal?.aborted) {
                await onError(error);
            }

            throw error;
        }

        // PROVIDER / OTHER FAILURE

        if (assistantMessage?._id) {

            const normalizedError = {
                code: error.code ?? "AI_GENERATION_FAILED",

                message: error.message ?? "AI generation failed.",

                retryable: error.retryable ?? false,
            };

            assistantMessage =
                await messageRepository.updateMessage(
                    assistantMessage._id,
                    {
                        content: assistantText,

                        status: MESSAGE_STATUS.FAILED,

                        metadata: {
                            finishReason: "error",
                            latency,
                            error: normalizedError,
                        },
                    }
                );
        }

        await onError(error);

        throw error;
    }
};


// Get Messages By Chat
const getMessagesByChat = async (
    userId,
    chatId
) => {

    await chatService.verifyChatAccess(
        chatId,
        userId
    );

    return messageRepository.findMessagesByChat(
        chatId
    );

};


// Get Message By ID
const getMessageById = async (
    userId,
    messageId
) => {

    const message = await messageRepository.findMessageById(
        messageId
    );


    if (!message) {

        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            "Message not found."
        );

    }


    await chatService.verifyChatAccess(
        message.chat,
        userId
    );


    return message;

};


// Delete Message
const deleteMessage = async (
    userId,
    messageId
) => {

    await getMessageById(
        userId,
        messageId
    );

    return messageRepository.deleteMessage(
        messageId
    );
};


// Generate Conversation Summary
const generateConversationSummary = async (
    chatId,
    aiOptions = {}
) => {

    // Verify chat
    const chat = await chatRepository.findById(chatId);


    if (!chat) {

        throw new ApiError(
            HTTP_STATUS.NOT_FOUND,
            "Chat not found."
        );

    }


    // Get history
    const history = await messageRepository.findMessagesByChat(chatId);


    // Generate summary
    const summary = await summaryService.summarizeConversation(
        history,
        {

            provider:
                aiOptions.provider ??
                chat.provider ??
                DEFAULT_PROVIDER,

            model: aiOptions.model ?? chat.model ?? DEFAULT_MODEL,

        }
    );


    // Save summary
    await chatService.updateSummary(
        chatId,
        summary
    );

    return summary;

};

// Update Message

const markMessageCompleted = async (
    messageId,
    data = {}
) => {

    return messageRepository.updateMessageStatus(
        messageId,
        MESSAGE_STATUS.COMPLETED,
        data
    );
};

// Update Message
const markMessageFailed = async (
    messageId,
    error,
    latency = null
) => {

    return messageRepository.updateMessageStatus(
        messageId,
        MESSAGE_STATUS.FAILED,
        {
            "metadata.finishReason": "error",

            "metadata.latency": latency,

            "metadata.error": {
                code: error?.code ?? "AI_GENERATION_FAILED",
                message: error?.message ?? "AI generation failed.",
                retryable: error?.retryable ?? false,
            },
        }
    );
};

// Update Message
const markMessageCancelled = async (
    messageId,
    latency = null,
    partialContent = ""
) => {

    return messageRepository.updateMessageStatus(
        messageId,
        MESSAGE_STATUS.CANCELLED,
        {
            content: partialContent,

            "metadata.finishReason": "cancelled",

            "metadata.latency": latency,

            "metadata.error": {
                code: "AI_GENERATION_CANCELLED",
                message: "AI generation was cancelled.",
                retryable: false,
            },
        }
    );
};


// Exports
export const messageService = {

    sendUserMessage,
    regenerateResponse,
    editMessage,
    streamMessage,
    getMessagesByChat,
    getMessageById,
    deleteMessage,
    generateConversationSummary,

    markMessageCompleted,
    markMessageFailed,
    markMessageCancelled

};