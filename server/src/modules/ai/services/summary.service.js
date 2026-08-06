import { aiService } from "../ai.service.js";

const buildSummaryPrompt = (history) => {

    const conversation = history
        .map(
            (message) =>
                `${message.role}: ${message.content}`
        )
        .join("\n\n");

    return [
        {
            role: "USER",
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

const summarizeConversation = async (history) => {

    const conversation = buildSummaryPrompt(history);

    const response = await aiService.generateResponse(conversation);

    return response.content;

};

export const summaryService = {
    summarizeConversation,
};