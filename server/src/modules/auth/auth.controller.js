import { authService } from "./auth.service.js";
import { ApiResponse } from "./../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "./../../shared/constants/httpStatus.js";
import { refreshCookieOptions } from "../../shared/utils/cookies.js";
import { asyncHandler } from "./../../shared/utils/asyncHandler.js";
import { COOKIES } from "../../shared/constants/cookies.js";

export const register = asyncHandler(async (req, res) => {
	// Capture session context at login time so refresh sessions can be audited later.
	const context = {
		ipAddress: req.ip,
		userAgent: req.get("user-agent") || "",
	};

	const { user, accessToken, refreshToken } = await authService.register(
		req.validatedData.body,
		context,
	);

	res.cookie(COOKIES.REFRESH_TOKEN, refreshToken, refreshCookieOptions);

	return ApiResponse.success(
		res,
		HTTP_STATUS.CREATED,
		"User registered successfully",
		{
			user,
			accessToken,
		},
	);
});

export const login = asyncHandler(async (req, res) => {
	const context = {
		ipAddress: req.ip,
		userAgent: req.get("user-agent") || "",
	};

	const { user, accessToken, refreshToken } = await authService.login(
		req.validatedData.body,
		context,
	);

	res.cookie(COOKIES.REFRESH_TOKEN, refreshToken, refreshCookieOptions);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"User logged in successfully",
		{
			user,
			accessToken,
		},
	);
});

export const refresh = asyncHandler(async (req, res) => {
	// The browser sends the long-lived token as an HTTP-only cookie, never in JSON.
	const refreshToken = req.cookies[COOKIES.REFRESH_TOKEN];

	const data = await authService.refresh(refreshToken);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"Access token refreshed successfully",
		data,
	);
});

export const logout = asyncHandler(async (req, res) => {
	const refreshToken = req.cookies[COOKIES.REFRESH_TOKEN];

	await authService.logout(refreshToken);

	res.clearCookie(COOKIES.REFRESH_TOKEN, refreshCookieOptions);

	return ApiResponse.success(
		res,
		HTTP_STATUS.OK,
		"User logged out successfully",
	);
});
