import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { messageService } from "./message.service.js";
import { ApiResponse } from './../../shared/responses/ApiResponse.js';
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";

export const sendMessage = asyncHandler(async (req, res) => {

    const message = await messageService.sendUserMessage(
        req.auth.userId,
        req.body.chatId,
        req.body.content
    );


    return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Message sent successfully",
        message
    );

});

export const getMessages = asyncHandler(async (req, res) => {

    const messages = await messageService.getMessagesbyChat(
        req.auth.userId,
        req.params.chatId
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Messages fetched successfully",
        messages
    );
});

export const deleteMessage = asyncHandler(async (req, res) => {

    await messageService.deleteMessage(
        req.auth.userId,
        req.params.messageId
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Message deleted successfully",
    )
})