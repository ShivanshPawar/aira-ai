import { buildContextWindow } from "./utils/context-window.js";

export const buildConversation = (
	history,
	summary = "",
	maxTokens
) => {

	const context = buildContextWindow(
		history,
		summary,
		maxTokens
	);

	// Convert database role constants into the lower-case, provider-neutral message format.
	return context.map((message) => ({

		role: message.role === "USER" || message.role === "user"
			? "user"
			: message.role === "ASSISTANT" || message.role === "assistant"
				? "assistant"
				: "system",

		content: message.content,

		attachments: message.attachments || [],

	}));

};
