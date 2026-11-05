import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { messageService } from "./message.service.js";
import { ApiResponse } from "./../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { ApiError } from "../../shared/errors/ApiError.js";

const getStreamErrorMessage = (error) => {
	return error instanceof ApiError
		? error.message
		: "AI response generation failed.";
};

export const sendMessage = asyncHandler(async (req, res) => {
	const message = await messageService.sendUserMessage(
		req.auth.userId,
		req.validatedData.body.chatId,
		req.validatedData.body.content,
		req.validatedData.body.attachments,
	);

	return ApiResponse.success(
		res,
		HTTP_STATUS.CREATED,
		"Message sent successfully",
		message,
	);
});

export const regenerateResponse = asyncHandler(async (req, res) => {
	const response = await messageService.regenerateResponse(
		req.auth.userId,
		req.validatedData.params.messageId,
	);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"Response regenerated successfully",
		response,
	);
});

export const editMessage = asyncHandler(async (req, res) => {
	const response = await messageService.editMessage(
		req.auth.userId,
		req.validatedData.params.messageId,
		req.validatedData.body.content,
		req.validatedData.body.attachments,
	);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"Message edited successfully",
		response,
	);
});

export const getMessages = asyncHandler(async (req, res) => {
	const messages = await messageService.getMessagesByChat(
		req.auth.userId,
		req.validatedData.params.chatId,
	);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"Messages fetched successfully",
		messages,
	);
});

export const deleteMessage = asyncHandler(async (req, res) => {
	await messageService.deleteMessage(
		req.auth.userId,
		req.validatedData.params.messageId,
	);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"Message deleted successfully",
	);
});

export const streamMessage = async (req, res) => {
	const controller = new AbortController();

	const abortGeneration = () => {
		if (!controller.signal.aborted) {
			controller.abort();
		}
	};

	// Abort upstream generation when the client disconnects instead of continuing billable work.
	req.on("aborted", abortGeneration);

	res.on("close", () => {
		if (!res.writableEnded) {
			abortGeneration();
		}
	});

	// SSE stays open while token callbacks write incremental JSON events.
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders?.();

	try {
		await messageService.streamMessage(
			req.auth.userId,
			req.validatedData.body.chatId,
			req.validatedData.body.content,
			{
				onToken(text) {
					if (controller.signal.aborted || res.writableEnded) {
						return;
					}

					res.write(
						`data: ${JSON.stringify({
							type: "chunk",
							content: text,
						})}\n\n`,
					);
				},

				onComplete({ assistantMessage }) {
					if (controller.signal.aborted || res.writableEnded) {
						return;
					}

					res.write(
						`data: ${JSON.stringify({
							type: "done",
							messageId: assistantMessage._id,
						})}\n\n`,
					);

					res.end();
				},

				onError(error) {
					if (controller.signal.aborted || res.writableEnded) {
						return;
					}

					res.write(
						`data: ${JSON.stringify({
							type: "error",
							message: getStreamErrorMessage(error),
						})}\n\n`,
					);

					res.end();
				},
			},
			req.validatedData.body.attachments,
			controller.signal,
		);
	} catch (error) {
		if (controller.signal.aborted || res.writableEnded) {
			return;
		}

		res.write(
			`data: ${JSON.stringify({
				type: "error",
				message: getStreamErrorMessage(error),
				code: error?.code ?? "UNKNOWN_ERROR",
			})}\n\n`,
		);

		res.end();
	}
};

export const retryStreamMessage = async (req, res) => {
	const controller = new AbortController();

	const abortGeneration = () => {
		if (!controller.signal.aborted) {
			controller.abort();
		}
	};

	req.on("aborted", abortGeneration);

	res.on("close", () => {
		if (!res.writableEnded) {
			abortGeneration();
		}
	});

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");

	res.flushHeaders?.();

	try {
		await messageService.retryStreamMessage(
			req.auth.userId,
			req.validatedData.params.messageId,
			{
				onToken(text) {
					if (controller.signal.aborted || res.writableEnded) {
						return;
					}

					res.write(
						`data: ${JSON.stringify({
							type: "chunk",
							content: text,
						})}\n\n`,
					);
				},

				onComplete({ assistantMessage }) {
					if (controller.signal.aborted || res.writableEnded) {
						return;
					}

					res.write(
						`data: ${JSON.stringify({
							type: "done",
							messageId: assistantMessage._id,
						})}\n\n`,
					);

					res.end();
				},

				onError(error) {
					if (controller.signal.aborted || res.writableEnded) {
						return;
					}

					res.write(
						`data: ${JSON.stringify({
							type: "error",
							message: getStreamErrorMessage(error),
						})}\n\n`,
					);

					res.end();
				},
			},
			controller.signal,
		);
	} catch (error) {
		if (controller.signal.aborted || res.writableEnded) {
			return;
		}

		res.write(
			`data: ${JSON.stringify({
				type: "error",
				message: getStreamErrorMessage(error),
				code: error.code ?? "UNKNOWN_ERROR",
			})}\n\n`,
		);

		res.end();
	}
};
