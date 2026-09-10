import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { ApiResponse } from "../../shared/responses/ApiResponse.js";
import { asyncHandler } from "./../../shared/utils/asyncHandler.js";
import { chatService } from "./chat.service.js";

export const createChat = asyncHandler(async (req, res) => {
  const chat = await chatService.createChat(
    req.auth.userId,
    req.validatedData.body,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.CREATED,
    "Chat created successfully",
    chat,
  );
});

export const getChats = asyncHandler(async (req, res) => {
  const chats = await chatService.getChats(
    req.auth.userId,
    req.validatedData.query,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    "Chats fetched successfully",
    chats,
  );
});

export const getArchivedChats = asyncHandler(async (req, res) => {
  const chats = await chatService.getArchivedChats(
    req.auth.userId,
    req.validatedData.query,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    "Archived chats fetched successfully",
    chats,
  );
});

export const getChatById = asyncHandler(async (req, res) => {
  const chat = await chatService.getChatById(
    req.validatedData.params.chatId,
    req.auth.userId,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    "Chat fetched successfully",
    chat,
  );
});

export const updateChat = asyncHandler(async (req, res) => {
  const chat = await chatService.updateChat(
    req.validatedData.params.chatId,
    req.auth.userId,
    req.validatedData.body,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    "Chat updated successfully",
    chat,
  );
});

export const renameChat = asyncHandler(async (req, res) => {
  const chat = await chatService.renameChat(
    req.validatedData.params.chatId,
    req.auth.userId,
    req.validatedData.body.title,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    "Chat renamed successfully",
    chat,
  );
});

export const togglePin = asyncHandler(async (req, res) => {
  const chat = await chatService.togglePin(
    req.validatedData.params.chatId,
    req.auth.userId,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    chat.isPinned ? "Chat pinned successfully" : "Chat unpinned successfully",
    chat,
  );
});

export const toggleArchive = asyncHandler(async (req, res) => {
  const chat = await chatService.toggleArchive(
    req.validatedData.params.chatId,
    req.auth.userId,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    chat.isArchived
      ? "Chat archived successfully"
      : "Chat unarchived successfully",
    chat,
  );
});

export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await chatService.deleteChat(
    req.validatedData.params.chatId,
    req.auth.userId,
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    "Chat deleted successfully",
    chat,
  );
});
