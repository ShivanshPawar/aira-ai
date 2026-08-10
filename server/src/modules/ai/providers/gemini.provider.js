import { GoogleGenAI } from "@google/genai";
import { env } from "../../../config/env.js";
import { buildGeminiMessages } from "../adapters/gemini.adapter.js";
import { createAIProviderContract } from "../contracts/ai-provider.contract.js";
import { createAIResponse } from "../utils/ai-response.js";
import { createDoneEvent, createTokenEvent } from "../contracts/ai-stream-event.js";

const client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
});

const generateResponse = async (
    conversation,
    options = {}
) => {

    const model = options.model || "gemini-2.5-flash";

    const contents = await buildGeminiMessages(conversation);

    const response = await client.models.generateContent({
        model,
        contents,
    });

    return createAIResponse({
        content: response.text,

        provider: options.provider,

        model,

        finishReason: response.candidates?.[0]?.finishReason ?? null,

        usage: {
            prompt: response.usageMetadata?.promptTokenCount ?? 0,

            completion: response.usageMetadata?.candidatesTokenCount ?? 0,

            total: response.usageMetadata?.totalTokenCount ?? 0,
        },
    });

};

const generateStream = async (
    conversation,
    options = {}
) => {
    const model = options.model || "gemini-2.5-flash";

    const contents = await buildGeminiMessages(conversation);

    const stream = await client.models.generateContentStream({
        model,
        contents,
    });

    return (async function* () {

        let finalUsage = null;
        let finalFinishReason = null;

        for await (const chunk of stream) {

            const text = chunk.text ?? "";

            if (text) {
                yield createTokenEvent(text);
            }

            const candidate = chunk.candidates?.[0];

            if (candidate?.finishReason) {
                finalFinishReason = candidate.finishReason;
            }

            if (chunk.usageMetadata) {
                finalUsage = {
                    prompt: chunk.usageMetadata.promptTokenCount ?? 0,

                    completion: chunk.usageMetadata.candidatesTokenCount ?? 0,

                    total: chunk.usageMetadata.totalTokenCount ?? 0,
                };
            }
        }

        yield createDoneEvent({
            finishReason: finalFinishReason,
            usage: finalUsage,
        });

    })();
};




export const geminiProvider = createAIProviderContract({
    generateResponse,
    generateStream,
});