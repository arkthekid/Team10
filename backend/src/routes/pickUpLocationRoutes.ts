import { Router } from "express";
import * as pickUpLocationController from "../controllers/pickUpLocationController";
import { protect } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

export default router;