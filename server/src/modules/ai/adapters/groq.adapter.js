const buildGroqMessages = (
    conversation,
    systemPrompt = null
) => {

    const messages = conversation.map((message) => ({
        role: message.role,
        content: message.content,
    }));

    if (systemPrompt) {
        messages.unshift({
            role: "system",
            content: systemPrompt,
        });
    }

    return messages;
};

export {
    buildGroqMessages,
};