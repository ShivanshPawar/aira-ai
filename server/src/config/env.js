import dotenv from "dotenv";
import { URL } from "node:url";

dotenv.config();

export const normalizeClientOrigin = (value) => {
	if (!value) return value;

	const trimmed = value.trim();
	const hasWrappingQuotes =
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"));
	const unquoted = hasWrappingQuotes ? trimmed.slice(1, -1).trim() : trimmed;

	try {
		const url = new URL(unquoted);
		if (
			(url.protocol === "http:" || url.protocol === "https:") &&
			!url.username &&
			!url.password &&
			url.pathname === "/" &&
			!url.search &&
			!url.hash
		) {
			return url.origin;
		}
	} catch {
		// Keep invalid input intact so validateEnv can report the configuration error.
	}

	return unquoted;
};

export const validateClientOrigin = (value) => {
	try {
		const clientUrl = new URL(value);
		if (
			(clientUrl.protocol !== "http:" && clientUrl.protocol !== "https:") ||
			clientUrl.origin !== value ||
			clientUrl.username ||
			clientUrl.password
		) {
			throw new Error();
		}
	} catch {
		throw new Error(
			"CLIENT_URL must be a frontend origin such as https://aira-ai-dffa.onrender.com, without quotes or a path.",
		);
	}

	return value;
};

const parseDuration = (value) => {
	// Convert the human-readable token lifetime into milliseconds for cookie expiry.
	const match = /^(\d+)\s*([smhdw])$/.exec(value ?? "");

	if (!match) {
		return null;
	}

	const amount = Number(match[1]);
	const multipliers = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
		w: 7 * 24 * 60 * 60 * 1000,
	};

	return amount * multipliers[match[2]];
};

export const env = {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: Number(process.env.PORT) || 5000,

	MONGODB_URI: process.env.MONGODB_URI,

	CLIENT_URL: normalizeClientOrigin(process.env.CLIENT_URL),

	JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

	ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || "15m",

	REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || "7d",

	REFRESH_TOKEN_MAX_AGE: parseDuration(
		process.env.REFRESH_TOKEN_EXPIRES || "7d",
	),

	GEMINI_API_KEY: process.env.GEMINI_API_KEY,
	GROQ_API_KEY: process.env.GROQ_API_KEY,

	IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
	IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
	IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
};

export const validateEnv = () => {
	const required = [
		"MONGODB_URI",
		"CLIENT_URL",
		"JWT_ACCESS_SECRET",
		"JWT_REFRESH_SECRET",
		"IMAGEKIT_PUBLIC_KEY",
		"IMAGEKIT_PRIVATE_KEY",
		"IMAGEKIT_URL_ENDPOINT",
	];

	const missing = required.filter((key) => !env[key]);

	if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) {
		// The service can operate with either provider, but cannot generate without both missing.
		missing.push("GEMINI_API_KEY or GROQ_API_KEY");
	}

	if (missing.length) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}`,
		);
	}

	validateClientOrigin(env.CLIENT_URL);

	if (!env.REFRESH_TOKEN_MAX_AGE) {
		throw new Error(
			"REFRESH_TOKEN_EXPIRES must use a positive s, m, h, d, or w duration.",
		);
	}
};
