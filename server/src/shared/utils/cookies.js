import { env } from "../../config/env.js";

export const createRefreshCookieOptions = (nodeEnv, maxAge) => ({
	httpOnly: true,
	secure: nodeEnv === "production",
	sameSite: nodeEnv === "production" ? "none" : "lax",
	partitioned: nodeEnv === "production",
	maxAge,
});

export const refreshCookieOptions = createRefreshCookieOptions(
	env.NODE_ENV,
	env.REFRESH_TOKEN_MAX_AGE,
);
