export const buildConversationPrompt = (messages) => {
    return messages.map((message) => ({
        role:
            message.role === "USER"
                ? "user"
                : "model",
        content: message.content
    }));
};
