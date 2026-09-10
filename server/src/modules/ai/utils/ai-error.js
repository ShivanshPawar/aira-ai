import { AICancelledError } from "../errors/ai-cancelled.error.js";
import { AIProviderError } from "../errors/ai-error.js";

export const normalizeAIError = (error, { provider = null } = {}) => {
	// Preserve application errors so their retry behavior and safe message are not replaced.
	if (error instanceof AICancelledError) {
		return error;
	}

	if (error instanceof AIProviderError) {
		return error;
	}

	// Different HTTP clients name aborts differently, but callers need one cancellation type.
	if (
		error?.name === "AbortError" ||
		error?.code === "ABORT_ERR" ||
		error?.code === "ERR_ABORTED"
	) {
		return new AICancelledError("AI generation was cancelled.");
	}

	// Providers expose status codes through different error shapes.
	const status =
		error?.status ?? error?.statusCode ?? error?.response?.status ?? null;

	if (status === 429 || error?.code === "RATE_LIMITED") {
		return new AIProviderError({
			message: "AI provider rate limit exceeded.",
			provider,
			code: "AI_RATE_LIMITED",
			statusCode: 429,
			retryable: true,
			cause: error,
		});
	}

	if (status === 401 || status === 403) {
		return new AIProviderError({
			message: "AI provider authentication failed.",
			provider,
			code: "AI_AUTHENTICATION_ERROR",
			statusCode: 502,
			retryable: false,
			cause: error,
		});
	}

	if (
		error?.code === "ETIMEDOUT" ||
		error?.code === "ECONNABORTED" ||
		error?.name === "TimeoutError"
	) {
		return new AIProviderError({
			message: "AI provider request timed out.",
			provider,
			code: "AI_TIMEOUT",
			statusCode: 504,
			retryable: true,
			cause: error,
		});
	}

	// Do not pass an unexpected provider message directly to the API client.
	return new AIProviderError({
		message: "AI provider request failed.",
		provider,
		code: "AI_PROVIDER_ERROR",
		statusCode: 502,
		retryable: false,
		cause: error,
	});
};
