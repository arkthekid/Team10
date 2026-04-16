import { Router } from "express";
import { register, login, getMe, googleAuth, logout } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);
router.post("/google", googleAuth);
router.post("/logout", protect, logout);

export default router;