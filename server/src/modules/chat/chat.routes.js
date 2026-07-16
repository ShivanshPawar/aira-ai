import { Router } from "express";
import { createChat, getChats, updateChat, deleteChat } from "./chat.controller.js";
import { updateChatSchema } from "./chat.validator.js";
import { protect } from './../../middlewares/auth.middleware.js';
import { validate } from './../../middlewares/validation.middleware.js';
import { getChatById } from './chat.controller.js';
import { createChatSchema } from './chat.validator.js';

const router = Router();

router.use(protect);

router.post("/", validate(createChatSchema), createChat)

router.get("/", getChats);

router.get("/:chatId", getChatById)

router.patch("/:chatId", validate(updateChatSchema), updateChat);

router.delete("/:chatId", deleteChat);

export default router;