import { aiFactory } from "./ai.factory.js";
import { resolveConfig } from "./config/config.resolver.js";

const generateResponse = async (
    conversation,
    options = {}
) => {

    const config = resolveConfig(options);

    const provider = aiFactory.getProvider(config.provider);

    return provider.generateResponse(
        conversation,
        config
    );

};

const generateStream = async (
    conversation,
    options = {}
) => {

    const config = resolveConfig(options);

    const provider = aiFactory.getProvider(config.provider);

    return provider.generateStream(
        conversation,
        config
    );

};

export const aiService = {
    generateResponse,
    generateStream,
};