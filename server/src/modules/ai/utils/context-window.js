import { AI_CONTEXT } from "../ai.constants.js";

const estimateTokens = (value = "") => {
    return Math.ceil(String(value).length / 3);
};

const truncateToTokenBudget = (
    value = "",
    maxTokens
) => {
    return String(value).slice(0, maxTokens * 3);
};

const getMessageTokens = (message) => {
    const storedTokens = message.tokenUsage?.total ?? 0;
    const contentTokens = estimateTokens(message.content ?? "");

    return Math.max(storedTokens, contentTokens);
};

const buildContextWindow = (
    history,
    summary = "",
    maxTokens = AI_CONTEXT.MAX_CONTEXT_TOKENS
) => {

    let totalTokens = 0;

    const selected = [];

    for (let i = history.length - 1; i >= 0; i--) {

        const message = history[i];

        const tokens = getMessageTokens(message);

        if (
            totalTokens + tokens >
            maxTokens
        ) {
            if (selected.length === 0) {
                selected.unshift({
                    role: message.role,
                    content: truncateToTokenBudget(
                        message.content ?? "",
                        maxTokens
                    ),
                    attachments: message.attachments || [],
                    tokenUsage: {
                        total: maxTokens,
                    },
                });
            }

            break;
        }

        selected.unshift(message);

        totalTokens += tokens;

    }

    const context = [];

    if (summary) {

        context.push({

            role: "SYSTEM",

            content: `Conversation Summary:

${summary}`,

            attachments: [],

            tokenUsage: {
                total: 0,
            },

        });

    }

    context.push(...selected);

    return context;

};

export {
    buildContextWindow,
};
