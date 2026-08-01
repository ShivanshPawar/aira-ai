import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiResponse } from "../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { fileService } from "./file.service.js";

export const uploadFile = asyncHandler(async (req, res) => {

    const file = await fileService.uploadFile(
        req.auth.userId,
        req.file
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "File uploaded successfully",
        file
    );

});