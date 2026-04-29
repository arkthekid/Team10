import { Router } from "express";
import * as reportController from "../controllers/reportController";
import { protect } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

router.post("/", protect, reportController.createReport);

router.get("/", protect, requireAdmin, reportController.getReports);
router.get("/:id", protect, requireAdmin, reportController.getReportById);
router.patch("/:id/status", protect, requireAdmin, reportController.updateReportStatus);

export default router;