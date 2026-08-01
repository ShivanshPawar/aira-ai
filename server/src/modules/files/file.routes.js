import { Router } from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

import { uploadFile } from "./file.controller.js";

const router = Router();

router.use(protect);

router.post(
    "/upload",
    upload.single("file"),
    uploadFile
);

export default router;