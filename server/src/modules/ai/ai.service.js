import { aiFactory } from "./ai.factory.js";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "./ai.constants.js";

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

export const aiService = {
    generateResponse,
}