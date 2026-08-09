import { AI_MODELS, AI_PROVIDERS } from "../ai.constants.js";

export const GROQ_CONFIG = {

    provider: AI_PROVIDERS.GROQ,

    model: AI_MODELS.OPENAI_120B,

    temperature: 0.7,

    maxOutputTokens: 2048,

    topP: 1,

};
