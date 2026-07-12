import { Router } from "express";

import { register, login } from "./auth.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { registerSchema, loginSchema } from './auth.validator.js';
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

export default router;