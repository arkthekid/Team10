import { Router } from "express";
import * as blockController from "../controllers/blockController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/:id", protect, blockController.blockUser);
router.get("/", protect, blockController.getMyBlockedUsers);
router.delete("/:id", protect, blockController.unblockUser);

export default router;