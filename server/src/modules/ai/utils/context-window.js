import { AI_CONTEXT } from "../ai.constants.js";

const buildContextWindow = (
    history,
    maxTokens = AI_CONTEXT.MAX_CONTEXT_TOKENS
) => {

    let totalTokens = 0;

    const selected = [];

    for (let i = history.length - 1; i >= 0; i--) {

        const message = history[i];

        const tokens = message.tokenUsage?.total ?? 0;

        if (
            totalTokens + tokens >
            maxTokens
        ) {
            break;
        }

        selected.unshift(message);

        totalTokens += tokens;

    }

    return selected;

};

export {
    buildContextWindow,
};