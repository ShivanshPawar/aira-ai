import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";
import { buildGeminiContents } from "../utils/attachment.builder.js";

const client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
});

const generateResponse = async (
    conversation,
    options = {}
) => {

    const model = options.model || "gemini-2.5-flash";

    const contents = await buildGeminiContents(conversation);

    // console.log(JSON.stringify(contents, null, 2));

    const response = await client.models.generateContent({
        model,
        contents,
    });

    return {
        content: response.text,

        finishReason:
            response.candidates?.[0]?.finishReason ?? null,

        usage: {
            prompt:
                response.usageMetadata?.promptTokenCount ?? 0,

            completion:
                response.usageMetadata?.candidatesTokenCount ?? 0,

            total:
                response.usageMetadata?.totalTokenCount ?? 0,
        }
    };

};

const generateStream = async (
    messages,
    options = {}
) => {

    const model = options.model || "gemini-2.5-flash";

    const contents = await buildGeminiContents(conversation);


    const stream = await client.models.generateContentStream({
        model,
        contents,
    });

    return stream;
};



export const geminiProvider = {
    generateResponse,
    generateStream
}