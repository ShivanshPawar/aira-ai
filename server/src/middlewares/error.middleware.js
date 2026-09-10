import { HTTP_STATUS } from "../shared/constants/httpStatus.js";
import { ApiError } from "../shared/errors/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode;
  let message = err.message;

  if (err.name === "ValidationError" || err.name === "CastError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid request data.";
  } else if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Invalid or expired token.";
  } else if (
    err.code === "LIMIT_FILE_SIZE" ||
    err.type === "entity.too.large"
  ) {
    statusCode = HTTP_STATUS.PAYLOAD_TOO_LARGE;
    message = "Request payload exceeds the allowed limit.";
  } else if (err.name === "MulterError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message =
      err.code === "LIMIT_FILE_COUNT"
        ? "Only one file can be uploaded per request."
        : "Invalid file upload.";
  } else if (err.message === "Unexpected end of form") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Malformed multipart upload.";
  } else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = "A record with this value already exists.";
  }

  if (!statusCode) {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  if (
    !(err instanceof ApiError) &&
    statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    message = "Internal Server Error";
  }

  return res.status(statusCode).json({
    success: false,
    message: message || "Internal Server Error",
    errors: null,
  });
};
