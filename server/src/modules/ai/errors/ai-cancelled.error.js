export class AICancelledError extends Error {

    constructor(message = "AI generation was cancelled.") {
        super(message);

        this.name = "AICancelledError";
        this.code = "AI_GENERATION_CANCELLED";
        this.statusCode = 499;
        this.retryable = false;
    }

}