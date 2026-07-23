import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import { deleteMessage, getMessages, sendMessage, streamMessage } from "./message.controller.js";
import { sendMessageSchema } from "./message.validator.js";
import { protect } from "../../middlewares/auth.middleware.js";


const router = Router();

router.use(protect);

router.post("/", validate(sendMessageSchema), sendMessage);

const streamMessageSchema = sendMessageSchema;

router.post("/stream", validate(streamMessageSchema), streamMessage);

router.get("/:chatId", getMessages);

router.delete("/:messageId", deleteMessage);

export default router;