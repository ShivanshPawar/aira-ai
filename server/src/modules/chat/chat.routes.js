import { Router } from "express";
import {
	createChat,
	getChats,
	updateChat,
	deleteChat,
	renameChat,
	togglePin,
	toggleArchive,
	getArchivedChats,
} from "./chat.controller.js";
import {
	chatIdSchema,
	chatListSchema,
	createChatSchema,
	updateChatSchema,
	updateChatTitleSchema,
} from "./chat.validator.js";
import { protect } from "./../../middlewares/auth.middleware.js";
import { validate } from "./../../middlewares/validation.middleware.js";
import { getChatById } from "./chat.controller.js";

const router = Router();

router.use(protect);

router.post("/", validate(createChatSchema), createChat);

router.get("/", validate(chatListSchema), getChats);

router.get("/archived", validate(chatListSchema), getArchivedChats);

router.get("/:chatId", validate(chatIdSchema), getChatById);

router.patch("/:chatId", validate(updateChatSchema), updateChat);

router.patch("/:chatId/rename", validate(updateChatTitleSchema), renameChat);

router.patch("/:chatId/pin", validate(chatIdSchema), togglePin);

router.patch("/:chatId/archive", validate(chatIdSchema), toggleArchive);

router.delete("/:chatId", validate(chatIdSchema), deleteChat);

export default router;
