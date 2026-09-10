import dotenv from "dotenv";

dotenv.config();

const parseDuration = (value) => {
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

  CLIENT_URL: process.env.CLIENT_URL,

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
    missing.push("GEMINI_API_KEY or GROQ_API_KEY");
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (!env.REFRESH_TOKEN_MAX_AGE) {
    throw new Error(
      "REFRESH_TOKEN_EXPIRES must use a positive s, m, h, d, or w duration.",
    );
  }
};
