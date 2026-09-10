import { env } from "../../config/env.js";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: env.REFRESH_TOKEN_MAX_AGE,
};
