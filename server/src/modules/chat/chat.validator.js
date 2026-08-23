import { z } from "zod";
import { AI_PROVIDERS } from "../../shared/constants/ai.js";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
);

export const createChatSchema = z.object({
    body: z.object({
        provider: z
            .enum(Object.values(AI_PROVIDERS))
            .optional(),

        model: z
            .string()
            .trim()
            .min(1, "Model is required.")
            .max(100, "Model name is too long.")
            .optional(),
    }),
});

export const updateChatSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Title is required.")
            .max(120, "Title cannot exceed 120 characters.")
            .optional(),

        isPinned: z
            .boolean()
            .optional(),

        isArchived: z
            .boolean()
            .optional(),
    }),
});

export const updateChatTitleSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Title is required.")
            .max(100, "Title cannot exceed 100 characters."),
    }),
});