import { authService } from "./auth.service.js";
import { ApiResponse } from "./../../shared/responses/ApiResponse.js";
import { HTTP_STATUS } from "./../../shared/constants/httpStatus.js";
import { refreshCookieOptions } from "../../shared/utils/cookies.js";
import { asyncHandler } from './../../shared/utils/asyncHandler.js';
import { COOKIES } from "../../shared/constants/cookies.js";


// Register a new user
export const register = asyncHandler(async (req, res) => {
    const context = {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
    };

    const { user, accessToken, refreshToken } =
        await authService.register(
            req.validatedData.body,
            context
        );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "User registered successfully",
        {
            user,
            accessToken,
        }
    )
});


// Login an existing user
export const login = asyncHandler(async (req, res) => {
    const context = {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || "",
    };

    const {
        user,
        accessToken,
        refreshToken,
    } = await authService.login(
        req.validatedData.body,
        context
    );

    res.cookie(
        COOKIES.REFRESH_TOKEN,
        refreshToken,
        refreshCookieOptions
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "User logged in successfully",
        {
            user,
            accessToken,
        }
    )
})


// Refresh access token using refresh token
export const refresh = asyncHandler(async (req, res) => {

    const refreshToken = req.cookies[COOKIES.REFRESH_TOKEN];

    const data = await authService.refresh(refreshToken);

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Access token refreshed successfully",
        data
    )

})


// Logout a user
export const logout = asyncHandler(async (req, res) => {

    const refreshToken = req.cookies[COOKIES.REFRESH_TOKEN];

    await authService.logout(refreshToken);

    res.clearCookie(
        COOKIES.REFRESH_TOKEN,
        refreshCookieOptions
    );

    return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "User logged out successfully"
    )
})