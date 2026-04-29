import { Router } from "express";
import * as reviewController from "../controllers/reviewController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/:userId", protect, reviewController.createReview);
router.get("/:userId", reviewController.getReviewsByUserId);
router.delete("/:reviewId", protect, reviewController.deleteReview);

export default router;