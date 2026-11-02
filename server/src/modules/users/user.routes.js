import { Router } from "express";
import { changePassword, getCurrentUser, updateProfile } from "./user.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { changePasswordSchema, updateProfileSchema } from "./user.validator.js";

const router = Router();

router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, validate(updateProfileSchema), updateProfile);
router.patch("/me/password", protect, validate(changePasswordSchema), changePassword);

export default router;
