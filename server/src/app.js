import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
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

const app = express();

// Global Middlewares

app.use(helmet());

app.use(cors({
  origin: 'http://127.0.0.1:5500', // Allow your frontend origin
  methods: ['POST', 'OPTIONS'],    // Allow necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow your custom headers
}));

// app.use(compression());

app.use(morgen("dev"));

app.use(express.json());

app.use(cookieParser());

app.use(globalRateLimiter);

// Routes

app.use("/api/v1", routes);

app.use("/api/v1/auth", authRoutes)

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/chats", chatRoutes);

app.use("/api/v1/messages", messageRoutes);

// Error Handling

app.use(notFound);

app.use(errorHandler);

export default app;