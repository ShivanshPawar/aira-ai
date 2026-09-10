export const AI_PROVIDERS = {
  GEMINI: "GEMINI",
  GROQ: "GROQ",
};

export const AI_MODELS = {
  GEMINI_FLASH: "gemini-2.5-flash",

  OPENAI_120B: "openai/gpt-oss-120b",

  GROQ_COMPOUND: "groq/compound",

  GROQ_COMPOUND_MINI: "groq/compound-mini",
};

export const DEFAULT_PROVIDER = AI_PROVIDERS.GROQ;

export const DEFAULT_MODEL = AI_MODELS.GROQ_COMPOUND;

export const AI_PROVIDER_MODELS = {
  [AI_PROVIDERS.GEMINI]: [AI_MODELS.GEMINI_FLASH],
  [AI_PROVIDERS.GROQ]: [
    AI_MODELS.OPENAI_120B,
    AI_MODELS.GROQ_COMPOUND,
    AI_MODELS.GROQ_COMPOUND_MINI,
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
