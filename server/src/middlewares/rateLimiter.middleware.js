import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: "Too many requests. Please try again later.",
      errors: null,
    });
  },
});
