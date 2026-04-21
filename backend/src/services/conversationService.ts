import { AppDataSource } from "../config/data-source";
import { Conversation } from "../entities/Conversation";
import { Listing } from "../entities/Listing";
import { AppError } from "../utils/AppError";

const conversationRepo = () => AppDataSource.getRepository(Conversation);
const listingRepo = () => AppDataSource.getRepository(Listing);

export const startConversation = async (listingId: string, buyerId: string) => {
  const listing = await listingRepo().findOne({ where: { listingId } });
  if (!listing) throw new AppError("Listing not found", 404);

  if (listing.sellerId === buyerId) {
    throw new AppError("You cannot message yourself", 400);
  }

  const existing = await conversationRepo().findOne({
    where: { listingId, buyerId },
    relations: ["listing", "buyer", "seller"],
  });
  if (existing) return existing;

  const conversation = conversationRepo().create({
    listingId,
    buyerId,
    sellerId: listing.sellerId,
  });

  return conversationRepo().save(conversation);
};

export const getConversationsForListing = async (listingId: string, userId: string) => {
  return conversationRepo().find({
    where: [
      { listingId, sellerId: userId },
      { listingId, buyerId: userId },
    ],
    relations: ["buyer", "seller", "listing"],
    order: { updatedAt: "DESC" },
  });
};

export const getConversationById = async (conversationId: string, userId: string) => {
  const conversation = await conversationRepo().findOne({
    where: { conversationId: conversationId },
    relations: ["buyer", "seller", "listing", "messages"],
  });

  if (!conversation) throw new AppError("Conversation not found", 404);

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  return conversation;
};

export const getMyConversations = async (userId: string) => {
  return conversationRepo().find({
    where: [{ buyerId: userId }, { sellerId: userId }],
    relations: ["buyer", "seller", "listing"],
    order: { updatedAt: "DESC" },
  });
};

export const deleteConversation = async (conversationId: string, userId: string) => {
  const conversation = await conversationRepo().findOne({
    where: { conversationId: conversationId },
  });

  if (!conversation) throw new AppError("Conversation not found", 404);

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  await conversationRepo().remove(conversation);
};

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

export async function markAsReceived(conversationId: string, userId: string) {
  const repo = AppDataSource.getRepository(Conversation);
  const conversation = await repo.findOne({
    where: { conversationId },
    relations: ["listing"],
  });
  if (!conversation) throw new AppError("Conversation not found");

  if (!conversation.listing) throw new AppError("Listing not found");
  if (conversation.listing.buyerId != userId) throw new AppError("Only the buyer can mark a listing as received");
  if (conversation.listing.status != "sold_pending") throw new AppError("Seller has to confirm the order first");

  conversation.listing.status = "completed";
  conversation.listing.buyerMarkedReceivedAt = new Date();

  const listingRepo = AppDataSource.getRepository(Listing);
  return listingRepo.save(conversation.listing);
}