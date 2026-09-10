import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { uploadSingleFile } from "../../middlewares/upload.middleware.js";

import { uploadFile } from "./file.controller.js";

const router = Router();

router.use(protect);

router.post(
    "/upload",
    uploadSingleFile,
    uploadFile
);

export default router;
