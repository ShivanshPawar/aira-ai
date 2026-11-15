import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
	// Keep a broad IP-based safety net without restricting ordinary app use.
	windowMs: 15 * 60 * 1000,
	limit: 1000,

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

export const aiGenerationRateLimiter = rateLimit({
	// AI generation has a separate per-account cap to reduce cost and prevent abuse.
	windowMs: 60 * 60 * 1000,
	limit: 60,
	keyGenerator: (req) => req.auth.userId.toString(),

	standardHeaders: true,
	legacyHeaders: false,

	handler: (_req, res, _next, options) => {
		res.status(options.statusCode).json({
			success: false,
			message: "AI generation limit reached. Please try again later.",
			errors: null,
		});
	},
});
