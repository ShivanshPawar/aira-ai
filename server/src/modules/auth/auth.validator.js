import { z } from "zod";

export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters long.")
        .max(50, "Name must be at most 50 characters long."),

      email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please enter a valid email address."),

      password: z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .max(50, "Password cannot be more than 50 characters long."),
    })
    .strict(),

  params: z.object({}).strict(),
  query: z.object({}).strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please enter a valid email address."),

      password: z.string().min(1, "Password is required."),
    })
    .strict(),

  params: z.object({}).strict(),
  query: z.object({}).strict(),
});
