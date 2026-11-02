import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { userService } from "./user.service.js";
import { ApiResponse } from "../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { COOKIES } from "../../shared/constants/cookies.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
	const user = await userService.getCurrentUser(req.auth.userId);
	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"profile fetched successfully",
		user
	);
});

export const updateProfile = asyncHandler(async (req, res) => {
	const user = await userService.updateProfile(req.auth.userId, req.validatedData.body);
	return ApiResponse.success(res, HTTP_STATUS.OK, "Profile updated successfully", user);
});

export const changePassword = asyncHandler(async (req, res) => {
	const user = await userService.changePassword(req.auth.userId, req.validatedData.body, req.cookies[COOKIES.REFRESH_TOKEN]);
	return ApiResponse.success(res, HTTP_STATUS.OK, "Password updated successfully", user);
});
