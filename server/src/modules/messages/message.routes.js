import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import {
	deleteMessage,
	editMessage,
	getMessages,
	regenerateResponse,
	sendMessage,
	streamMessage,
	retryStreamMessage,
} from "./message.controller.js";
import {
	chatMessagesSchema,
	editMessageSchema,
	messageIdSchema,
	sendMessageSchema,
} from "./message.validator.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { aiGenerationRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

router.use(protect);

router.post(
	"/",
	validate(sendMessageSchema),
	aiGenerationRateLimiter,
	sendMessage,
);

router.post(
	"/:messageId/regenerate",
	validate(messageIdSchema),
	aiGenerationRateLimiter,
	regenerateResponse,
);

router.put(
	"/:messageId",
	validate(editMessageSchema),
	aiGenerationRateLimiter,
	editMessage,
);

router.post(
	"/stream",
	validate(sendMessageSchema),
	aiGenerationRateLimiter,
	streamMessage,
);

router.post(
	"/:messageId/retry/stream",
	validate(messageIdSchema),
	aiGenerationRateLimiter,
	retryStreamMessage,
);

router.get("/:chatId", validate(chatMessagesSchema), getMessages);

router.delete("/:messageId", validate(messageIdSchema), deleteMessage);

export default router;
