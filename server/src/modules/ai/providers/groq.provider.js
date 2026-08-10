import Groq from "groq-sdk";

import { env } from "../../../config/env.js";
import { buildGroqMessages } from "../adapters/groq.adapter.js";
import { createAIProviderContract } from "../contracts/ai-provider.contract.js";
import { createAIResponse } from "../utils/ai-response.js";
import { createDoneEvent, createTokenEvent } from "../contracts/ai-stream-event.js";

const client = new Groq({
    apiKey: env.GROQ_API_KEY,
});

const generateResponse = async (
    conversation,
    options = {}
) => {

    console.log("=== GROQ PROVIDER OPTIONS ===");
    console.dir(options, { depth: null });

    console.log("=== GROQ SYSTEM PROMPT ===");
    console.log(options.systemPrompt);

    const messages = buildGroqMessages(
        conversation,
        options.systemPrompt
    );

    console.log("=== GROQ MESSAGES ===");
    console.dir(messages, { depth: null });

    const response = await client.chat.completions.create({

        model: options.model,

        messages,

        temperature: options.temperature,

        max_completion_tokens: options.maxOutputTokens,

        top_p: options.topP,

    });

    console.log("=== GROQ MESSAGES ===");
    console.dir(messages, { depth: null });

    return createAIResponse({
        content: response.choices[0].message.content,

        provider: options.provider,

        model: options.model,

        finishReason: response.choices[0].finish_reason ?? null,

        usage: {
            prompt: response.usage?.prompt_tokens ?? 0,

            completion: response.usage?.completion_tokens ?? 0,

            total: response.usage?.total_tokens ?? 0,
        },
    });

};

const generateStream = async (
    conversation,
    options = {}
) => {

    const messages = buildGroqMessages(
        conversation,
        options.systemPrompt
    );

    const stream = await client.chat.completions.create({
        model: options.model,

        messages,

        temperature: options.temperature,

        max_completion_tokens: options.maxOutputTokens,

        top_p: options.topP,

        stream: true,

        stream_options: {
            include_usage: true,
        },
    });

    return (async function* () {

        let finalUsage = null;
        let finalFinishReason = null;

        for await (const chunk of stream) {

            const choice = chunk.choices?.[0];

            const content =
                choice?.delta?.content ?? "";

            if (content) {
                yield createTokenEvent(content);
            }

            if (choice?.finish_reason) {
                finalFinishReason =
                    choice.finish_reason;
            }

            if (chunk.usage) {
                finalUsage = {
                    prompt:
                        chunk.usage.prompt_tokens ?? 0,

                    completion:
                        chunk.usage.completion_tokens ?? 0,

                    total:
                        chunk.usage.total_tokens ?? 0,
                };
            }
        }

        yield createDoneEvent({
            finishReason: finalFinishReason,
            usage: finalUsage,
        });

    })();
};


export const groqProvider = createAIProviderContract({
    generateResponse,
    generateStream,
});