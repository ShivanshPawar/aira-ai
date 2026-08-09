const AI_STREAM_EVENT_TYPES = {
    TOKEN: "token",
    DONE: "done",
    ERROR: "error",
};

const createTokenEvent = (content) => ({
    type: AI_STREAM_EVENT_TYPES.TOKEN,
    content,
});

const createDoneEvent = ({
    finishReason = null,
    usage = {},
} = {}) => ({
    type: AI_STREAM_EVENT_TYPES.DONE,

    finishReason,

    usage: {
        prompt: usage.prompt ?? 0,
        completion: usage.completion ?? 0,
        total: usage.total ?? 0,
    },
});

const createErrorEvent = (error) => ({
    type: AI_STREAM_EVENT_TYPES.ERROR,
    error,
});

export {
    AI_STREAM_EVENT_TYPES,
    createTokenEvent,
    createDoneEvent,
    createErrorEvent,
};