import { env } from "../config/env.js";
import { HTTP_STATUS } from "../shared/constants/httpStatus.js";

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: env.NODE_ENV === "development" ? err.stack : undefined,

    })
}