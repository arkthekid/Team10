import { Router } from "express";
import * as conversationController from "../controllers/conversationController";
import * as messageController from "../controllers/messageController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", protect, conversationController.getMyConversations);
router.get("/:conversationId", protect, conversationController.getConversationById);
router.delete("/:conversationId", protect, conversationController.deleteConversation);
router.get("/:conversationId/messages", protect, messageController.getMessages);
router.post("/:conversationId/messages", protect, messageController.sendMessage);
router.patch("/:conversationId/mark-sold", protect, conversationController.markAsSold);
router.patch("/:conversationId/mark-completed", protect, conversationController.markAsCompleted);

export default router;