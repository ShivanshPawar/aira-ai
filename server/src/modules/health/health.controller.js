import { ApiResponse } from "../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";

export const getHealth = (req, res) => {
    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Server is up and running",
        {
            status: "healthy",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
        }
    );
};