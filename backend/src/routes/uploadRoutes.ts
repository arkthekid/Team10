// src/routes/uploadRoutes.ts
import { Router } from "express";
import { upload, uploadListingImage } from "../controllers/uploadController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, upload.single("image"), uploadListingImage);

export default router;