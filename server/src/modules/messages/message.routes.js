import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import { deleteMessage, editMessage, getMessages, regenerateResponse, sendMessage, streamMessage, retryStreamMessage } from "./message.controller.js";
import { sendMessageSchema } from "./message.validator.js";
import { protect } from "../../middlewares/auth.middleware.js";


const router = Router();

router.use(protect);

router.post("/", validate(sendMessageSchema), sendMessage);

router.post("/:messageId/regenerate", validate(sendMessageSchema), regenerateResponse);

router.put("/:messageId", validate(sendMessageSchema), editMessage);

const streamMessageSchema = sendMessageSchema;

router.post("/stream", validate(streamMessageSchema), streamMessage);

router.post("/:messageId/retry/stream", retryStreamMessage);

router.get("/:chatId", getMessages);

router.delete("/:messageId", deleteMessage);

export default router;