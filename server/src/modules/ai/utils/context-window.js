import { AI_CONTEXT } from "../ai.constants.js";

const estimateTokens = (value = "") => {
	return Math.ceil(String(value).length / 3);
};

const truncateToTokenBudget = (value = "", maxTokens) => {
	return String(value).slice(0, maxTokens * 3);
};

const getMessageTokens = (message) => {
	return estimateTokens(message.content ?? "");
};

const buildContextWindow = (
	history = [],
	summary = "",
	maxTokens = AI_CONTEXT.MAX_CONTEXT_TOKENS,
) => {
	const selected = [];

	const summaryText = summary?.trim()
		? `Conversation Summary:\n\n${summary.trim()}`
		: "";

	const summaryTokens = estimateTokens(summaryText);

	// Reserve room for saved memory before selecting the newest raw messages.
	let remainingTokens = Math.max(maxTokens - summaryTokens, 0);

	// Traverse backward to prefer recent context while keeping chronological order via unshift.
	for (let i = history.length - 1; i >= 0; i--) {
		const message = history[i];

		if (message.status && message.status !== "COMPLETED") {
			continue;
		}

		const tokens = getMessageTokens(message);

		if (tokens > remainingTokens) {
			// A single oversized newest message is still more useful than an empty history.
			if (selected.length === 0 && remainingTokens > 0) {
				selected.unshift({
					...message,

					content: truncateToTokenBudget(
						message.content ?? "",
						remainingTokens,
					),

					attachments: message.attachments || [],
				});
			}

			break;
		}

		selected.unshift(message);

		remainingTokens -= tokens;
	}

	const context = [];

	if (summaryText) {
		context.push({
			role: "SYSTEM",

			content: summaryText,

			attachments: [],
		});
	}

	context.push(...selected);

	return context;
};

export { buildContextWindow };
