import { Router } from "express";
import { register, login, getMe, googleAuth } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/google", googleAuth);

export default router;