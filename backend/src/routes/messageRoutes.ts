import { Router } from "express";
import * as messageController from "../controllers/messageController";
import { protect } from "../middleware/auth";

const router = Router();

router.delete("/:messageId", protect, messageController.deleteMessage);

export default router;