import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const attachmentsSchema = z
  .array(objectIdSchema)
  .max(10, "You can attach at most 10 files.")
  .refine(
    (attachments) => new Set(attachments).size === attachments.length,
    "Attachments cannot contain duplicate file IDs.",
  )
  .default([]);

const messageBodySchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Message content is required.")
      .max(10000, "Message content cannot exceed 10,000 characters."),
    attachments: attachmentsSchema,
  })
  .strict();

const messageIdParamsSchema = z
  .object({
    messageId: objectIdSchema,
  })
  .strict();

const chatIdParamsSchema = z
  .object({
    chatId: objectIdSchema,
  })
  .strict();

const noBodySchema = z.object({}).strict().optional();

export const sendMessageSchema = z.object({
  body: messageBodySchema.extend({
    chatId: objectIdSchema,
  }),
  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const editMessageSchema = z.object({
  body: messageBodySchema,
  params: messageIdParamsSchema,
  query: z.object({}).strict(),
});

export const messageIdSchema = z.object({
  body: noBodySchema,
  params: messageIdParamsSchema,
  query: z.object({}).strict(),
});

export const chatMessagesSchema = z.object({
  body: noBodySchema,
  params: chatIdParamsSchema,
  query: z.object({}).strict(),
});
