import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
} from "../controllers/transactionController";

const router = Router();

router.post("/", protect, createTransaction);
router.get("/", protect, getTransactions);
router.get("/:id", protect, getTransactionById);
router.patch("/:id/status", protect, updateTransactionStatus);

export default router;