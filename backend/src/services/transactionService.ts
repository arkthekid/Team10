import mongoose from "mongoose";
import Transaction from "../models/Transaction";
import Listing from "../models/Listing";
import { AppError } from "../utils/AppError";

type TransactionQuery = {
  status?: string;
  role?: string; // "buyer" or "seller"
  page?: string;
  limit?: string;
};

export async function createTransaction(
  data: {
    listingId: string;
    finalPrice: number;
  },
  buyerId: string
) {
  if (!mongoose.Types.ObjectId.isValid(data.listingId)) {
    throw new AppError("Invalid listing id", 400);
  }

  const listing = await Listing.findById(data.listingId);
  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  const sellerId = listing.sellerId?.toString?.();
  if (!sellerId) {
    throw new AppError("Listing seller not found", 400);
  }

  if (sellerId === buyerId) {
    throw new AppError("Buyer cannot create transaction for own listing", 400);
  }

  const transaction = await Transaction.create({
    buyerId,
    sellerId,
    listingId: data.listingId,
    finalPrice: data.finalPrice,
    status: "PENDING",
  });

  return transaction;
}

export async function getTransactions(userId: string, query: TransactionQuery) {
  const filter: any = {};

  if (query.role === "buyer") {
    filter.buyerId = userId;
  } else if (query.role === "seller") {
    filter.sellerId = userId;
  } else {
    filter.$or = [{ buyerId: userId }, { sellerId: userId }];
  }

  if (query.status) {
    filter.status = query.status;
  }

  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate("buyerId", "name umassEmail")
      .populate("sellerId", "name umassEmail")
      .populate("listingId", "title status price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getTransactionById(id: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid transaction id", 400);
  }

  const transaction = await Transaction.findById(id)
    .populate("buyerId", "name umassEmail")
    .populate("sellerId", "name umassEmail")
    .populate("listingId", "title status price");

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  const isBuyer = transaction.buyerId?._id?.toString?.() === userId || transaction.buyerId?.toString?.() === userId;
  const isSeller = transaction.sellerId?._id?.toString?.() === userId || transaction.sellerId?.toString?.() === userId;

  if (!isBuyer && !isSeller) {
    throw new AppError("Not allowed", 403);
  }

  return transaction;
}

export async function updateTransactionStatus(
  id: string,
  status: "PENDING" | "COMPLETED" | "CANCELLED",
  userId: string
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid transaction id", 400);
  }

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  const isBuyer = transaction.buyerId.toString() === userId;
  const isSeller = transaction.sellerId.toString() === userId;

  if (!isBuyer && !isSeller) {
    throw new AppError("Not allowed", 403);
  }

  transaction.status = status;
  await transaction.save();

  // optional business rule:
  // if completed, mark listing sold
  if (status === "COMPLETED") {
    await Listing.findByIdAndUpdate(transaction.listingId, { status: "sold" });
  }

  return transaction;
}