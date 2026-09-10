import { env } from "../../config/env.js";

export const refreshCookieOptions = {
	// Cross-site production cookies require HTTPS and SameSite=None for browser delivery.
	httpOnly: true,
	secure: env.NODE_ENV === "production",
	sameSite: env.NODE_ENV === "production" ? "none" : "lax",
	maxAge: env.REFRESH_TOKEN_MAX_AGE,
};
