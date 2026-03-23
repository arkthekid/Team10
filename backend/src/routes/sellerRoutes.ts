import { Router } from "express";
import { createSeller } from "../controllers/sellerController";

const router = Router();
router.post("/", createSeller);

export default router;