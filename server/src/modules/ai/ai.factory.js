import { AI_PROVIDERS } from "./ai.constants.js";
import { geminiProvider } from "./providers/gemini.provider.js";

const getProvider = (provider) => {
    switch (provider) {
        case AI_PROVIDERS.GEMINI:
            return geminiProvider;
        default:
            throw new Error(`Provider ${provider} not found`);
    }
}

export const aiFactory = {
    getProvider,
}