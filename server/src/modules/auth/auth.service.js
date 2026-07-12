import { authRepository } from "./auth.repository.js";
import { ApiError } from "../../shared/errors/ApiError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { AUTH } from "../../shared/constants/auth.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../shared/utils/jwt.js";
import { hashToken } from "../../shared/utils/crypto.js";


// Generate access and refresh tokens
const generateTokens = (user) => {
    const payload = {
        sub: user._id.toString(),
        role: user.role,
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};


// Create session in database
const createSession = async (user, refreshToken, context) => {
    const hashedToken = hashToken(refreshToken);

    return authRepository.createSession({
        user: user._id,
        refreshToken: hashedToken,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: new Date(Date.now() + AUTH.REFRESH_TOKEN_COOKIE_MAX_AGE),
    });
};


const createAuthResponse = async (user, context) => {
    const { accessToken, refreshToken } = generateTokens(user);

    await createSession(user, refreshToken, context);

    return {
        user: user.toJSON(),
        accessToken,
        refreshToken
    };
};


const register = async (userData, context) => {
    const existingUser = await authRepository.findUserByEmail(
        userData.email
    )

    if (existingUser) {
        throw new ApiError(HTTP_STATUS.CONFLICT, "User already exists");
    };

    const user = await authRepository.createUser(userData);

    return createAuthResponse(user, context);
};


const login = async (credentials, context) => {
    const { email, password } = credentials;

    const user = await authRepository.findUserByEmail(email, true);

    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
    }

    return createAuthResponse(user, context);
};

const validateRefreshSession = async (refreshToken) => {

    if (!refreshToken) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Refresh token is missing");
    }

    const decoded = verifyRefreshToken(refreshToken);

    const hashedToken = hashToken(refreshToken);

    const session = await authRepository.findSessionByToken(hashedToken);

    if (!session) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid session");
    }

    const user = await authRepository.findUserById(decoded.sub);

    if (!user) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not found");
    }

    return {
        user,
        session,
    };
}

const refresh = async (refreshToken) => {

    const { user } = await validateRefreshSession(refreshToken);

    const accessToken = generateAccessToken({
        sub: user._id.toString(),
        role: user.role,
    });

    return {
        accessToken,
    }

}

const logout = async (refreshToken) => {

    const { session } = await validateRefreshSession(refreshToken);

    await authRepository.revokeSession(session._id);

    return {
        message: "User logged out successfully"
    }
}


export const authService = {
    register,
    login,
    refresh,
    logout,
}