import { AI_PROVIDERS, DEFAULT_PROVIDER } from "../ai.constants.js";

import { GEMINI_CONFIG } from "./gemini.config.js";
import { GROQ_CONFIG } from "./groq.config.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

const getDefaultConfig = (provider) => {

	switch (provider) {

		case AI_PROVIDERS.GROQ:
			return GROQ_CONFIG;

		case AI_PROVIDERS.GEMINI:
			return GEMINI_CONFIG;

		default:
			return GROQ_CONFIG;
	}
};

const resolveConfig = (options = {}) => {

	const provider =options.provider ?? DEFAULT_PROVIDER;

	const defaults = getDefaultConfig(provider);

	let systemPrompt;

	if (options.systemPrompt === null) {

		// Summaries pass null to omit the normal assistant persona deliberately.
		systemPrompt = null;

	} else if (options.systemPrompt !== undefined) {

		// A chat prompt takes precedence over the shared persona without changing model defaults.
		systemPrompt = options.systemPrompt;

	} else {

		// Use the shared persona for normal chats when no override is present.
		systemPrompt = SYSTEM_PROMPT;
	}

	const config = {

		...defaults,

		...options,

		systemPrompt,

	};

	return config;
};

export {
	resolveConfig,
};
