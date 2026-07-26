
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { ApiResponse } from '../../shared/responses/ApiResponse.js';
import { asyncHandler } from './../../shared/utils/asyncHandler.js';
import { chatService } from './chat.service.js';

export const createChat = asyncHandler(async (req, res) => {

    const chat = await chatService.createChat(
        req.auth.userId,
        req.body
    )

    return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Chat created successfully",
        chat
    );

});

export const getChats = asyncHandler(async (req, res) => {

    const chats = await chatService.getChats(
        req.auth.userId,
        req.query
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Chats fetched successfully",
        chats
    );
});

export const getChatById = asyncHandler(async (req, res) => {

    const chat = await chatService.getChatById(
        req.params.chatId,
        req.auth.userId
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Chat fetched successfully",
        chat
    )
});

export const updateChat = asyncHandler(async (req, res) => {

    const chat = await chatService.updateChat(
        req.params.chatId,
        req.auth.userId,
        req.body
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Chat updated successfully",
        chat
    )
})

export const renameChat = asyncHandler(async (req, res) => {

    const chat = await chatService.renameChat(
        req.params.chatId,
        req.auth.userId,
        req.body.title
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Chat renamed successfully",
        chat
    )
})

export const togglePin = asyncHandler(async (req, res) => {

    const chat = await chatService.togglePin(
        req.params.chatId,
        req.auth.userId
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        chat.isPinned ? "Chat pinned successfully" : "Chat unpinned successfully",
        chat
    )
})

export const toggleArchive = asyncHandler(async (req, res) => {

    const chat = await chatService.toggleArchive(
        req.params.chatId,
        req.auth.userId
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        chat.isArchived ? "Chat archived successfully" : "Chat unarchived successfully",
        chat
    )
});

export const deleteChat = asyncHandler(async (req, res) => {

    const chat = await chatService.deleteChat(
        req.params.chatId,
        req.auth.userId
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Chat deleted successfully",
        chat
    )
})