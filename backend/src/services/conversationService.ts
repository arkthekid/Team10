import { AppDataSource } from "../config/data-source";
import { AppError } from "../utils/AppError";
import { Conversation } from "../entities/Conversation";
import { Listing } from "../entities/Listing";


export async function markAsSold(userId: string, conversationId: string) {
  const convRepo = AppDataSource.getRepository(Conversation);
  const conversation = await convRepo.findOne({
    where: { conversationId },
    relations: { listing: true },
  });
  if (!conversation) throw new AppError("Conversation not found");

  const listing = conversation.listing;
  if (!listing) throw new AppError("Listing not found");
  if (listing.sellerId !== userId) throw new AppError("Only seller can mark a listing as sold");
  if (listing.status !== "available") throw new AppError("Listing is not available");

  listing.buyerId = conversation.buyerId;
  listing.status = "sold_pending";
  listing.sellerMarkedSoldAt = new Date();

  const listingRepo = AppDataSource.getRepository(Listing);
  return listingRepo.save(listing);
}


export async function markAsReceived(listingId: string, userId: string) {
  const repo = AppDataSource.getRepository(Listing);
  const listing = await repo.findOneBy({ listingId });

  if (!listing) throw new AppError("Listing not found");
  if (listing.buyerId != userId) throw new AppError("Only the buyer can mark a listing as received");
  if (listing.status != "sold_pending") throw new AppError("Seller has to confirm the order first");

  listing.status = "completed";
  listing.buyerMarkedReceivedAt = new Date();

  return repo.save(listing);
}