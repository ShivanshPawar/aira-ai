import { SYSTEM_PROMPT } from "./system.prompt.js";

const resolveSystemPrompt = (systemPrompt) => {
    // Explicitly disabled
    if (systemPrompt === null) {
        return null;
    }

    // Custom prompt provided
    if (
        typeof systemPrompt === "string" && systemPrompt.trim()
    ) {
        return systemPrompt.trim();
    }

    // Default Aira prompt
    return SYSTEM_PROMPT;
};

export {
    resolveSystemPrompt,
};