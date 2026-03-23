// src/routes/listingRoutes.ts
import { Router } from "express";
import {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
} from "../controllers/listingController";
import { protect } from "../middleware/auth";

const router = Router();

// public
router.get("/", getListings);

// IMPORTANT: place BEFORE "/:id"
router.get("/me", protect, getMyListings);

// id route (leave it simple)
router.get("/:id", getListingById);

// protected writes
router.post("/", protect, createListing);
router.patch("/:id", protect, updateListing);
router.delete("/:id", protect, deleteListing);

export default router;