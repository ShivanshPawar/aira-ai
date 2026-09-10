import { AI_MODELS, AI_PROVIDERS, } from "../ai.constants.js";

export const GEMINI_CONFIG = {

	provider: AI_PROVIDERS.GEMINI,

	model: AI_MODELS.GEMINI_FLASH,

	temperature: 0.7,

	maxOutputTokens: 8192,

	topP: 0.95,

	topK: 40,

};