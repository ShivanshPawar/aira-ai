import { AI_PROVIDERS, DEFAULT_MODEL } from "../ai.constants.js";

export const GROQ_CONFIG = {
  provider: AI_PROVIDERS.GROQ,

  model: DEFAULT_MODEL,

  temperature: 0.7,

  maxOutputTokens: 2048,

  topP: 1,
};
