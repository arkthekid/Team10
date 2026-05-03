import { AppDataSource } from "../config/data-source";
import { Conversation } from "../entities/Conversation";
import { Listing } from "../entities/Listing";
import { AppError } from "../utils/AppError";
import {
  assertUsersNotBlocked,
  areUsersBlocked,
  getBlockedUserIdsForUser,
} from "./blockService";
const conversationRepo = () => AppDataSource.getRepository(Conversation);
const listingRepo = () => AppDataSource.getRepository(Listing);

export const startConversation = async (listingId: string, buyerId: string) => {
  const listing = await listingRepo().findOne({ where: { listingId } });
  if (!listing) throw new AppError("Listing not found", 404);

  if (listing.sellerId === buyerId) {
    throw new AppError("You cannot message yourself", 400);
  }

  // stop conversation creation if either side blocked the other
  await assertUsersNotBlocked(buyerId, listing.sellerId);

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
  const conversations = await conversationRepo().find({
    where: [
      { listingId, sellerId: userId },
      { listingId, buyerId: userId },
    ],
    relations: ["buyer", "seller", "listing"],
    order: { updatedAt: "DESC" },
  });

  // hide conversations where either side has blocked the other
  const filtered: Conversation[] = [];
  for (const conversation of conversations) {
    const blocked = await areUsersBlocked(conversation.buyerId, conversation.sellerId);
    if (!blocked) {
      filtered.push(conversation);
    }
  }

  return filtered;
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

  // prevent access if either side has blocked the other
  await assertUsersNotBlocked(conversation.buyerId, conversation.sellerId);

  return conversation;
};

export const getMyConversations = async (userId: string) => {
  const conversations = await conversationRepo().find({
    where: [{ buyerId: userId }, { sellerId: userId }],
    relations: ["buyer", "seller", "listing"],
    order: { updatedAt: "DESC" },
  });

  // gather all blocked users in either direction relative to this user
  const blockedUserIds = await getBlockedUserIdsForUser(userId);

  // hide blocked conversations from conversation list
  return conversations
    .filter(
      (conv) =>
        !blockedUserIds.includes(conv.buyerId) &&
        !blockedUserIds.includes(conv.sellerId)
    )
    .map((conv) => ({
    ...conv,
    listingStatus: conv.listing?.status ?? null,
  }));
};

export async function getConversationStatus(conversationId: string, userId: string) {
  const conversation = await conversationRepo().findOne({
    where: { conversationId },
    relations: ["listing"],
  });

  if (!conversation) throw new AppError("Conversation not found", 404);

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  // prevent status access if users are blocked
  await assertUsersNotBlocked(conversation.buyerId, conversation.sellerId);

  return {
    conversationId: conversation.conversationId,
    listingStatus: conversation.listing?.status,
    isArchived: conversation.isArchived,
  };
}

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

  // prevent buyer flow if users are blocked
  await assertUsersNotBlocked(conversation.buyerId, conversation.sellerId);

  if (!conversation.listing) throw new AppError("Listing not found");
  if (conversation.listing.buyerId != userId) throw new AppError("Only the buyer can mark a listing as received");
  if (conversation.listing.status != "sold_pending") throw new AppError("Seller has to confirm the order first");

  conversation.listing.status = "completed";
  conversation.listing.buyerMarkedReceivedAt = new Date();

  const listingRepo = AppDataSource.getRepository(Listing);
  return listingRepo.save(conversation.listing);
}
