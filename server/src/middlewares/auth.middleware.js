import { authRepository } from "../modules/auth/auth.repository.js";
import { verifyAccessToken } from "../shared/utils/jwt.js";
import { ApiError } from "../shared/errors/ApiError.js"
import { HTTP_STATUS } from "../shared/constants/httpStatus.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {

	const authorization = req.headers.authorization;

	if (!authorization?.startsWith("Bearer ")) {
		throw new ApiError(
			HTTP_STATUS.UNAUTHORIZED,
			"Access token is missing."
		);
	}

	const token = authorization.split(" ")[1];

	const decoded = verifyAccessToken(token);

	// A valid signature is not enough when the account was deleted after the token was issued.
	const user = await authRepository.findUserById(decoded.sub);

	if (!user) {
		throw new ApiError(
			HTTP_STATUS.UNAUTHORIZED,
			"User not found."
		);
	}

	// Expose only the identity needed by downstream authorization checks.
	req.auth = {
		userId: user._id,
		role: user.role,
	};

	next();

});
