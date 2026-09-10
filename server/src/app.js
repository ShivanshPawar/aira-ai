import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgen from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import routes from "./routes/index.js";

import { globalRateLimiter } from "./middlewares/rateLimiter.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import messageRoutes from "./modules/messages/message.routes.js";
import fileRoutes from "./modules/files/file.routes.js";

const app = express();

// Global Middlewares

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

if (env.NODE_ENV !== "production") {
  app.use(morgen("dev"));
}

app.use(express.json({ limit: "100kb" }));

app.use(cookieParser());

app.use(globalRateLimiter);

// Routes

app.use("/api/v1", routes);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/chats", chatRoutes);

app.use("/api/v1/messages", messageRoutes);

app.use("/api/v1/files", fileRoutes);

// Error Handling

app.use(notFound);

app.use(errorHandler);

export default app;
