import { Router } from "express";
import * as pickUpLocationController from "../controllers/pickUpLocationController";
import { protect } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

router.post("/", protect, requireAdmin, pickUpLocationController.createPickUpLocation);

export default router;