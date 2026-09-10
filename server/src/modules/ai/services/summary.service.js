import { aiService } from "../ai.service.js";
import { AI_CONTEXT } from "../ai.constants.js";

const estimateTokens = (value = "") => {
	return Math.ceil(String(value).length / 3);
};

const truncateToTokenBudget = (value = "", maxTokens) => {
	return String(value).slice(0, maxTokens * 3);
};

const buildSummaryText = (
	history,
	maxTokens = AI_CONTEXT.SUMMARY_INPUT_TOKENS,
) => {
	let totalTokens = 0;

	const selected = [];

	// Work backward so the summary always preserves the most recent useful context.
	for (let i = history.length - 1; i >= 0; i--) {
		const message = history[i];

		if (message.status && message.status !== "COMPLETED") {
			continue;
		}

		const line = `${message.role}: ${message.content}`;

		const tokens = estimateTokens(line);

		if (selected.length === 0 && tokens > maxTokens) {
			selected.unshift(truncateToTokenBudget(line, maxTokens));

			break;
		}

		if (selected.length > 0 && totalTokens + tokens > maxTokens) {
			break;
		}

		selected.unshift(line);

		totalTokens += tokens;
	}

	return selected.join("\n\n");
};

const buildSummaryPrompt = (
	history,
	maxInputTokens = AI_CONTEXT.SUMMARY_INPUT_TOKENS,
) => {
	const conversation = buildSummaryText(history, maxInputTokens);

	return [
		{
			role: "user",
			content: `
You are creating a long-term memory for an AI assistant.

Summarize the conversation into a concise paragraph.

Keep only information that will help continue future conversations.

Include:
- user preferences
- ongoing projects
- decisions
- important facts
- unresolved tasks

Exclude:
- greetings
- repeated information
- temporary questions
- detailed explanations

Write naturally as continuous prose.

Maximum length: 250 words.

Conversation:

${conversation}
`,
			attachments: [],
		},
	];
};

const summarizeConversation = async (history, options = {}) => {
	const { maxInputTokens = AI_CONTEXT.SUMMARY_INPUT_TOKENS, ...aiOptions } =
		options;

	const conversation = buildSummaryPrompt(history, maxInputTokens);

	// Keep summaries bounded so they free context space instead of consuming it all.
	const response = await aiService.generateResponse(conversation, {
		maxOutputTokens: AI_CONTEXT.SUMMARY_MAX_OUTPUT_TOKENS,
		...aiOptions,
		systemPrompt: null,
	});

	return response;
};

export const summaryService = {
	summarizeConversation,
};
