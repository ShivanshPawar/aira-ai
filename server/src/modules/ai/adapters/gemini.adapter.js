import { buildGeminiContents } from "../utils/attachment.builder.js";

const buildGeminiMessages = async (conversation) => {

    const normalized = conversation.map((message) => ({

        ...message,

        role: message.role === "assistant"
                ? "model"
                : "user",

    }));

    return buildGeminiContents(normalized);

};

export { buildGeminiMessages };