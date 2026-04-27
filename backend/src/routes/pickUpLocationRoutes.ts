import { Router } from "express";
import * as pickUpLocationController from "../controllers/pickUpLocationController";
import { protect } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

router.post("/", protect, requireAdmin, pickUpLocationController.createPickUpLocation);

router.get("/", pickUpLocationController.getAllPickUpLocations);
router.get("/:id", pickUpLocationController.getPickUpLocationById);

router.patch("/:id", protect, requireAdmin, pickUpLocationController.updatePickUpLocation);
router.delete("/:id", protect, requireAdmin, pickUpLocationController.deletePickUpLocation);

export default router;