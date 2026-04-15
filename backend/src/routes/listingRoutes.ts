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

// transaction handshake routes
/**
 * @route   PATCH /api/listings/:id/mark-sold
 * @param   {string} id - The Listing ID
 * @access  Private (Seller only)
 */
// router.patch("/:id/mark-sold", protect, listingController.markAsSold);
// router.patch("/:id/mark-received", protect, listingController.markAsReceived);

export default router;