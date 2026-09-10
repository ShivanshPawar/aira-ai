import { GoogleGenAI } from "@google/genai";

import { env } from "../../../config/env.js";
import { buildGeminiMessages } from "../adapters/gemini.adapter.js";
import { createAIProviderContract } from "../contracts/ai-provider.contract.js";
import { createAIResponse } from "../utils/ai-response.js";
import {
  createDoneEvent,
  createTokenEvent,
} from "../contracts/ai-stream-event.js";
import { normalizeAIError } from "../utils/ai-error.js";

// initialize the client with your API key
const client = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const buildGenerationConfig = (options) => {
  const config = {
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens,
    topP: options.topP,
    topK: options.topK,
    abortSignal: options.signal,
  };

  if (options.systemPrompt) {
    config.systemInstruction = options.systemPrompt;
  }

  return config;
};

// create a function to generate a response
const generateResponse = async (conversation, options = {}) => {
  // set the model
  const model = options.model || "gemini-2.5-flash";

  try {
    // build the messages
    const contents = await buildGeminiMessages(conversation);

    // generate the response
    const response = await client.models.generateContent({
      model,
      contents,
      config: buildGenerationConfig(options),
    });

    // return the response
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
  } catch (error) {
    throw normalizeAIError(error, { provider: options.provider });
  }
};

// create a function to generate a stream
const generateStream = async (conversation, options = {}) => {
  // set the model
  const model = options.model || "gemini-2.5-flash";

  try {
    // build the messages
    const contents = await buildGeminiMessages(conversation);

    // generate the stream
    const stream = await client.models.generateContentStream({
      model,
      contents,
      config: buildGenerationConfig(options),
    });

    // return the stream
    return (async function* () {
      let finalUsage = null;
      let finalFinishReason = null;

      try {
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

        // send the final event
        yield createDoneEvent({
          finishReason: finalFinishReason,
          usage: finalUsage,
        });
      } catch (error) {
        throw normalizeAIError(error, { provider: options.provider });
      }
    })(); // end return
  } catch (error) {
    throw normalizeAIError(error, { provider: options.provider });
  }
};

export const geminiProvider = createAIProviderContract({
  generateResponse,
  generateStream,
});
