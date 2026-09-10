export class AIProviderError extends Error {

	constructor({
		message = "AI provider request failed",
		provider = null,
		code = "AI_PROVIDER_ERROR",
		statusCode = 502,
		retryable = false,
		cause = null,
	} = {}) {

		super(message);

		this.name = "AIProviderError";

		this.provider = provider;

		this.code = code;

		this.statusCode = statusCode;

		this.retryable = retryable;

		this.cause = cause;
	}
}