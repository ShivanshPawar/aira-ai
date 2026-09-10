import Groq from "groq-sdk";

import { env } from "../../../config/env.js";
import { buildGroqMessages } from "../adapters/groq.adapter.js";
import { createAIProviderContract } from "../contracts/ai-provider.contract.js";
import { createAIResponse } from "../utils/ai-response.js";
import { createDoneEvent, createTokenEvent } from "../contracts/ai-stream-event.js";
import { normalizeAIError } from "../utils/ai-error.js";

// Reuse one configured client instead of creating a network client for every generation.
const client = new Groq({
	apiKey: env.GROQ_API_KEY,
});

const generateResponse = async (
	conversation,
	options = {}
) => {

	try {

		// Groq expects a chat-completions payload, so adapt the neutral conversation first.
		const messages = buildGroqMessages(
			conversation,
			options.systemPrompt
		);

		const response = await client.chat.completions.create({

			model: options.model,

			messages,

			temperature: options.temperature,

			max_completion_tokens: options.maxOutputTokens,

			top_p: options.topP,

		});

		// Convert Groq's response fields into the result shape used by the message service.
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
	}
	catch (error) {
		throw normalizeAIError(error, { provider: options.provider });
	}

};

const generateStream = async (
	conversation,
	options = {}
) => {

	try {

		const messages = buildGroqMessages(
			conversation,
			options.systemPrompt
		);

		const request = {
			model: options.model,
			messages,
			temperature: options.temperature,
			max_completion_tokens: options.maxOutputTokens,
			top_p: options.topP,
			stream: true,
			stream_options: {
				include_usage: true,
			},
		};

		const stream = await client.chat.completions.create(
			request,
			options.signal
				? {
					signal: options.signal,
				}
				: undefined
		);

		// Expose a normalized event stream so callers are independent of Groq chunk details.
		return (async function* () {

			let finalUsage = null;
			let finalFinishReason = null;

			try {

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

				// Usage is only included in the final chunk when stream_options enables it.
				yield createDoneEvent({
					finishReason: finalFinishReason,
					usage: finalUsage,
				});

			}
			catch (error) {
				throw normalizeAIError(error, { provider: options.provider });
			}

		})();
	}
	catch (error) {
		throw normalizeAIError(error, { provider: options.provider });
	}
};

export const groqProvider = createAIProviderContract({
	generateResponse,
	generateStream,
});
