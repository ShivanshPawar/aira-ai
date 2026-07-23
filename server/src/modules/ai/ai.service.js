import { aiFactory } from "./ai.factory.js";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "./ai.constants.js";
import { geminiProvider } from "./providers/gemini.provider.js";

const generateResponse = async (
    messages,
    options = {}
) => {
    const provider = aiFactory.getProvider(
        options.provider || DEFAULT_PROVIDER
    );

    return provider.generateResponse(
        messages, {
        model: options.model || DEFAULT_MODEL,
    });
};

const generateStream = async (
    messages,
    options = {}
) => {

    return geminiProvider.generateStream(
        messages,
        options
    );
};

export const aiService = {
    generateResponse,
    generateStream,
}