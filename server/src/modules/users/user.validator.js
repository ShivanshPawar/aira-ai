import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId.");
const noParams = z.object({}).strict();

export const updateProfileSchema = z.object({
	body: z.object({
		name: z.string().trim().min(3, "Name must be at least 3 characters long.").max(50, "Name must be at most 50 characters long.").optional(),
		avatarFileId: objectIdSchema.optional(),
	}).strict().refine((data) => Object.keys(data).length > 0, "At least one profile field is required."),
	params: noParams,
	query: noParams,
});

export const changePasswordSchema = z.object({
	body: z.object({
		currentPassword: z.string().min(1, "Current password is required."),
		newPassword: z.string().min(8, "Password must be at least 8 characters long.").max(50, "Password cannot be more than 50 characters long."),
	}).strict().refine((data) => data.currentPassword !== data.newPassword, {
		path: ["newPassword"],
		message: "Choose a new password.",
	}),
	params: noParams,
	query: noParams,
});
