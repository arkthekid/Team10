import { Router } from "express";
import { protect } from "../middleware/auth";
import * as conversationController from "../controllers/conversationController";

const router = Router();

router.patch("/conversations/:conversationId/mark-sold", protect, conversationController.markAsSold);
router.patch("/conversations/:conversationId/mark-completed", protect, conversationController.markAsCompleted);

