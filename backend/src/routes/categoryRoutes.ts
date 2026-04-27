import { Router } from "express";
import * as categoryController from "../controllers/categoryController";
import { protect } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

router.post("/", protect, requireAdmin, categoryController.createCategory);
router.get("/", categoryController.getCategory);
router.get("/:id", categoryController.getCategoryById);
router.patch("/:id", protect, requireAdmin, categoryController.updateCategory);
router.delete("/:id", protect, requireAdmin, categoryController.deleteCategory);

export default router;