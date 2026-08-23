import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
);

export const sendMessageSchema = z.object({
    body: z.object({
        chatId: objectIdSchema,

        content: z
            .string()
            .trim()
            .min(1, "Message content is required.")
            .max(10000, "Message content cannot exceed 10,000 characters."),

        attachments: z
            .array(objectIdSchema)
            .max(10, "You can attach at most 10 files.")
            .default([]),
    }),
});