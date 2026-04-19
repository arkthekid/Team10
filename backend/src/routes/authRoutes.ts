import { Router } from "express";
import { register, login, getMe, googleAuth, logout, verifyEmailController } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);
router.post("/google", googleAuth);
router.get("/verify-email", verifyEmailController);

export default router;