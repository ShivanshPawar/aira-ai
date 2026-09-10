import { buildGeminiContents } from "../utils/attachment.builder.js";

const buildGeminiMessages = async (conversation) => {

	const normalized = conversation.map((message) => ({

		...message,

		// Gemini calls assistant messages "model"; all other roles are user input here.
		role: message.role === "assistant"
				? "model"
				: "user",

	}));

	return buildGeminiContents(normalized);

};

export { buildGeminiMessages };
