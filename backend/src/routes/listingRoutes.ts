import { Router } from "express";
import * as listingController from "../controllers/listingController";
import * as imageController from "../controllers/uploadController";
import { protect } from "../middleware/auth";

const router = Router();

// public
router.get("/", listingController.getListings);
router.get("/me", protect, listingController.getMyListings);
router.get("/:id", listingController.getListingById);
router.get("/:id/status", listingController.getListingStatus);
router.get("/user/:userId", listingController.getListingsByUserId);
router.get("/orders/me", protect, listingController.getMyOrders);

router.post("/", protect, listingController.createListing);
router.patch("/:id", protect, listingController.updateListing);
router.delete("/:id", protect, listingController.deleteListing);

// image routes
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() })

router.post("/:listingId/images", protect, upload.array("images", 5), imageController.uploadListingImages);
router.delete("/images/:imageId", protect, imageController.deleteListingImage);

// conversation
import * as conversationController from "../controllers/conversationController";

router.post("/:listingId/conversations", protect, conversationController.startConversation);
router.get("/:listingId/conversations", protect, conversationController.getConversationsForListing);

export default router;