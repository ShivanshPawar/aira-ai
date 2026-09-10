import { SYSTEM_PROMPT } from "./system.prompt.js";

const resolveSystemPrompt = (systemPrompt) => {
	// Callers use null when a task, such as summarization, must not inherit the normal persona.
	if (systemPrompt === null) {
		return null;
	}

	// Trim before sending it upstream so whitespace-only overrides fall back to the default.
	if (
		typeof systemPrompt === "string" && systemPrompt.trim()
	) {
		return systemPrompt.trim();
	}

	// The shared prompt keeps ordinary chats consistent across providers.
	return SYSTEM_PROMPT;
};

export {
	resolveSystemPrompt,
};
