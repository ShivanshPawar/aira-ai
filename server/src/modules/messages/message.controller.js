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

export const streamMessage = async (req, res) => {
    // SSE Headers (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Optional flushHeaders
    res.flushHeaders?.();

    await messageService.streamMessage(
        req.auth.userId,
        req.body.chatId,
        req.body.content,

        {

            onToken(text) {
                res.write(
                    `data: ${JSON.stringify({
                        type: "chunk",
                        content: text,
                    })}\n\n`
                );
            },

            onComplete({ assistantMessage }) {
                res.write(
                    `data: ${JSON.stringify({
                        type: "done",
                        messageId: assistantMessage._id,
                    })}\n\n`
                );

                res.end();
            },

            onError(error) {
                res.write(
                    `data: ${JSON.stringify({
                        type: "error",
                        message: error.message,
                    })}\n\n`
                );

                res.end();
            },
        },

    );

};