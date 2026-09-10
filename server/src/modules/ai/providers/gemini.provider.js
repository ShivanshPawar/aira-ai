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

// Reuse one configured client instead of creating a network client for every generation.
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

const generateResponse = async (conversation, options = {}) => {
	const model = options.model || "gemini-2.5-flash";

	try {
		// Gemini needs its own role and attachment shape, so adapt the neutral conversation first.
		const contents = await buildGeminiMessages(conversation);

		const response = await client.models.generateContent({
			model,
			contents,
			config: buildGenerationConfig(options),
		});

		// Normalize Gemini metadata so services do not depend on provider-specific field names.
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

const generateStream = async (conversation, options = {}) => {
	const model = options.model || "gemini-2.5-flash";

	try {
		const contents = await buildGeminiMessages(conversation);

		const stream = await client.models.generateContentStream({
			model,
			contents,
			config: buildGenerationConfig(options),
		});

		// Yield the application's normalized events, not Gemini chunks, to keep controllers vendor-agnostic.
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

				// Usage and finish reason may arrive after the final text chunk.
				yield createDoneEvent({
					finishReason: finalFinishReason,
					usage: finalUsage,
				});
			} catch (error) {
				throw normalizeAIError(error, { provider: options.provider });
			}
		})();
	} catch (error) {
		throw normalizeAIError(error, { provider: options.provider });
	}
};

export const geminiProvider = createAIProviderContract({
	generateResponse,
	generateStream,
});
