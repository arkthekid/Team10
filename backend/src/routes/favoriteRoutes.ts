import { Router } from "express";
import * as favoriteController from "../controllers/favoriteController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/:listingId", protect, favoriteController.addFavorite);
router.get("/", protect, favoriteController.getMyFavorites);
router.delete("/:listingId", protect, favoriteController.removeFavorite);

export default router;