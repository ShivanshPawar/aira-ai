import { AI_PROVIDERS } from "./ai.constants.js";

import { geminiProvider } from "./providers/gemini.provider.js";
import { groqProvider } from "./providers/groq.provider.js";

const getProvider = (provider) => {

    switch (provider) {

        case AI_PROVIDERS.GEMINI:
            return geminiProvider;

        case AI_PROVIDERS.GROQ:
            return groqProvider;

        default:
            throw new Error(
                `Provider ${provider} not found`
            );

    }

};

export const aiFactory = {
    getProvider,
};