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
    where: { id: conversationId },
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
    where: { id: conversationId },
  });

  if (!conversation) throw new AppError("Conversation not found", 404);

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  await conversationRepo().remove(conversation);
};