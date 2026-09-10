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

const router = Router();

router.use(protect);

router.post("/", validate(sendMessageSchema), sendMessage);

router.post(
	"/:messageId/regenerate",
	validate(messageIdSchema),
	regenerateResponse,
);

router.put("/:messageId", validate(editMessageSchema), editMessage);

router.post("/stream", validate(sendMessageSchema), streamMessage);

router.post(
	"/:messageId/retry/stream",
	validate(messageIdSchema),
	retryStreamMessage,
);

router.get("/:chatId", validate(chatMessagesSchema), getMessages);

router.delete("/:messageId", validate(messageIdSchema), deleteMessage);

export default router;
