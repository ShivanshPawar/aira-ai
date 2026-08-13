import { AIProviderError } from "../errors/ai-error.js";

export const normalizeAIError = (
    error,
    {
        provider = null,
    } = {}
) => {

    // Already normalized
    if (error instanceof AIProviderError) {
        return error;
    }

    const status =
        error?.status ??
        error?.statusCode ??
        error?.response?.status ??
        null;


    // --------------------------------------------
    // Rate limit
    // --------------------------------------------

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


    // --------------------------------------------
    // Authentication
    // --------------------------------------------

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


    // --------------------------------------------
    // Timeout
    // --------------------------------------------

    if (
        error?.code === "ETIMEDOUT" || error?.code === "ECONNABORTED" || error?.name === "TimeoutError") {

        return new AIProviderError({

            message: "AI provider request timed out.",

            provider,

            code: "AI_TIMEOUT",

            statusCode: 504,

            retryable: true,

            cause: error,
        });
    }


    // --------------------------------------------
    // Generic provider failure
    // --------------------------------------------

    return new AIProviderError({

        message: error?.message ?? "AI provider request failed.",

        provider,

        code: "AI_PROVIDER_ERROR",

        statusCode: 502,

        retryable: false,

        cause: error,
    });
};