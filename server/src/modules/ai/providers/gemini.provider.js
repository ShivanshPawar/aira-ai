import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";

const client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
});

const generateResponse = async (
    messages,
    options = {}
) => {
    
    const model = options.model || "gemini-2.5-flash";

    const contents = messages.map((message) => ({
        role: message.role,
        parts: [
            {
                text: message.content,
            },
        ],
    }));

    console.log(JSON.stringify(contents, null, 2));

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

export const geminiProvider = {
    generateResponse,
}