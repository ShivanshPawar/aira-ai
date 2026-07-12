import { Router } from "express";
import { getCurrentUser } from "./user.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", protect, getCurrentUser);

export default router;