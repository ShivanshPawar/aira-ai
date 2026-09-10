import { Router } from "express";

import { register, login, refresh, logout } from "./auth.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { registerSchema, loginSchema } from "./auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refresh);

router.post("/logout", logout);

export default router;
