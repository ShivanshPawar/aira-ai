import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { userService } from "./user.service.js";
import { ApiResponse } from "../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
	const user = await userService.getCurrentUser(req.auth.userId);
	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"profile fetched successfully",
		user
	);
});