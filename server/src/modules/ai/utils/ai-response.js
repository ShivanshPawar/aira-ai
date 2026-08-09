const createAIResponse = ({
    content = "",
    provider,
    model,
    finishReason = null,
    usage = {},
}) => {

    return {
        content,

        provider,

        model,

        finishReason,

        usage: {
            prompt: usage.prompt ?? 0,
            completion: usage.completion ?? 0,
            total: usage.total ?? 0,
        },
    };
};

export {
    createAIResponse,
};