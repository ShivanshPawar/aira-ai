export const AI_PROVIDERS = {
	GEMINI: "GEMINI",
	GROQ: "GROQ",
};

export const AI_MODELS = {
	GEMINI_3_6_FLASH: "gemini-3.6-flash",

	GEMINI_3_5_FLASH_LITE: "gemini-3.5-flash-lite",

	GEMINI_3_1_FLASH_LITE: "gemini-3.1-flash-lite",

	GEMINI_3_FLASH_PREVIEW: "gemini-3-flash-preview",

	// Google restricts these legacy models to projects that have used them before.
	GEMINI_2_5_FLASH: "gemini-2.5-flash",

	OPENAI_120B: "openai/gpt-oss-120b",

	OPENAI_20B: "openai/gpt-oss-20b",
};

export const DEFAULT_PROVIDER = AI_PROVIDERS.GROQ;

export const DEFAULT_MODEL = AI_MODELS.OPENAI_20B;

export const AI_PROVIDER_MODELS = {
	[AI_PROVIDERS.GEMINI]: [
		AI_MODELS.GEMINI_3_6_FLASH,
		AI_MODELS.GEMINI_3_5_FLASH_LITE,
		AI_MODELS.GEMINI_3_1_FLASH_LITE,
		AI_MODELS.GEMINI_3_FLASH_PREVIEW,
		AI_MODELS.GEMINI_2_5_FLASH,
	],
	[AI_PROVIDERS.GROQ]: [
		AI_MODELS.OPENAI_120B,
		AI_MODELS.OPENAI_20B,
	],
};

export const isSupportedModel = (provider, model) => {
	return AI_PROVIDER_MODELS[provider]?.includes(model) ?? false;
};

export const AI_CONTEXT = {
	MAX_CONTEXT_TOKENS: 120000,

	GROQ_CONTEXT_TOKENS: 7000,

	SUMMARY_THRESHOLD: 100000,

	SUMMARY_KEEP_TOKENS: 30000,

	SUMMARY_INPUT_TOKENS: 7000,

	SUMMARY_MAX_OUTPUT_TOKENS: 512,
};
