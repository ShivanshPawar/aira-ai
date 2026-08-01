import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
);

export const sendMessageSchema = z.object({
    body: z.object({
        chatId: objectIdSchema,
        content: z.string().trim().min(1).max(10000),
        attachments: z
            .array(z.string())
            .default([]),
    }),
});
