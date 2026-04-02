import { Router } from "express";
import * as listingController from "../controllers/listingController";
import { protect } from "../middleware/auth";

const router = Router();

// public
router.get("/", listingController.getListings);
router.get("/me", protect, listingController.getMyListings);
router.get("/:id", listingController.getListingById);

// protected writes
router.post("/", protect, listingController.createListing);
router.patch("/:id", protect, listingController.updateListing);
router.delete("/:id", protect, listingController.deleteListing);

export default router;