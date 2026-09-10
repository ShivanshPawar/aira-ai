import { normalizeTokenUsage } from "./token-usage.js";

const createAIResponse = ({
	content = "",
	provider,
	model,
	finishReason = null,
	usage = {},
}) => {
	return {
		content,

		provider,

		model,

		finishReason,

		usage: normalizeTokenUsage(usage),
	};
};

export { createAIResponse };
