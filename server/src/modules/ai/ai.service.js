import { aiFactory } from "./ai.factory.js";
import { resolveConfig } from "./config/config.resolver.js";

const generateResponse = async (
	conversation,
	options = {}
) => {

	// Merge caller overrides with the selected provider defaults before making the request.
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

	// Streaming follows the same configuration path as one-shot responses.
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
