import { z } from "zod";
import {
	AI_MODELS,
	AI_PROVIDERS,
	DEFAULT_PROVIDER,
	isSupportedModel,
} from "../ai/ai.constants.js";

const objectIdSchema = z
	.string()
	.regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const chatConfigSchema = z
	.object({
		provider: z.enum(Object.values(AI_PROVIDERS)).optional(),
		model: z.enum(Object.values(AI_MODELS)).optional(),
	})
	.strict()
	.superRefine((data, context) => {
		// Individual enums are valid alone, so validate the provider/model combination separately.
		const provider = data.provider ?? DEFAULT_PROVIDER;

		if (data.model && !isSupportedModel(provider, data.model)) {
			context.addIssue({
				code: "custom",
				path: ["model"],
				message: "Model is not supported by the selected provider.",
			});
		}
	});

const querySchema = z
	.object({
		page: z.coerce.number().int().min(1).optional(),
		limit: z.coerce.number().int().min(1).max(100).optional(),
		search: z.string().trim().min(1).max(120).optional(),
		provider: z.enum(Object.values(AI_PROVIDERS)).optional(),
		model: z.enum(Object.values(AI_MODELS)).optional(),
		isPinned: z.enum(["true", "false"]).optional(),
	})
	.strict()
	.superRefine((data, context) => {
		// Filtering must reject combinations that no provider can actually serve.
		if (
			data.provider &&
			data.model &&
			!isSupportedModel(data.provider, data.model)
		) {
			context.addIssue({
				code: "custom",
				path: ["model"],
				message: "Model is not supported by the selected provider.",
			});
		}
	});

const chatIdParamsSchema = z
	.object({
		chatId: objectIdSchema,
	})
	.strict();

const noBodySchema = z.object({}).strict().optional();

export const createChatSchema = z.object({
	body: chatConfigSchema,
	params: z.object({}).strict(),
	query: z.object({}).strict(),
});

export const chatListSchema = z.object({
	body: noBodySchema,
	params: z.object({}).strict(),
	query: querySchema,
});

export const chatIdSchema = z.object({
	body: noBodySchema,
	params: chatIdParamsSchema,
	query: z.object({}).strict(),
});

export const updateChatSchema = z.object({
	body: z
		.object({
			title: z
				.string()
				.trim()
				.min(1, "Title is required.")
				.max(120, "Title cannot exceed 120 characters.")
				.optional(),
			isPinned: z.boolean().optional(),
			isArchived: z.boolean().optional(),
			provider: z.enum(Object.values(AI_PROVIDERS)).optional(),
			model: z.enum(Object.values(AI_MODELS)).optional(),
		})
		.strict()
		.refine(
			(data) => Object.keys(data).length > 0,
			"At least one chat field is required.",
		)
		.superRefine((data, context) => {
			// An update may change both fields at once, so validate their final pair together.
			if (
				data.provider &&
				data.model &&
				!isSupportedModel(data.provider, data.model)
			) {
				context.addIssue({
					code: "custom",
					path: ["model"],
					message: "Model is not supported by the selected provider.",
				});
			}
		}),
	params: chatIdParamsSchema,
	query: z.object({}).strict(),
});

export const updateChatTitleSchema = z.object({
	body: z
		.object({
			title: z
				.string()
				.trim()
				.min(1, "Title is required.")
				.max(100, "Title cannot exceed 100 characters."),
		})
		.strict(),
	params: chatIdParamsSchema,
	query: z.object({}).strict(),
});
