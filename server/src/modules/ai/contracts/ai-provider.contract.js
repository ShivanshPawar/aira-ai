/**
 * AI Provider Contract
 *
 * Every AI provider must implement:
 *
 * - generateResponse()
 * - generateStream()
 */

export const createAIProviderContract = ({
	generateResponse,
	generateStream,
}) => {

	if (typeof generateResponse !== "function") {
		throw new TypeError(
			"AI provider must implement generateResponse()"
		);
	}

	if (typeof generateStream !== "function") {
		throw new TypeError(
			"AI provider must implement generateStream()"
		);
	}

	return {
		generateResponse,
		generateStream,
	};
};