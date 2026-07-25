import { object, z } from "zod";
import { AI_PROVIDERS } from "../../shared/constants/ai.js";
import { model } from "mongoose";


export const createChatSchema = z.object({
    body: z.object({
        provider: z.enum(
            Object.values(AI_PROVIDERS)
        ).optional(),

        model: z.string().optional(),
    }),
});

export const updateChatSchema = z.object({
    body: z.object({

        title: z
            .string()
            .trim()
            .min(1)
            .max(120)
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