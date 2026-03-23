import Listing from "../models/Listing";
import { AppError } from "../utils/AppError";

type ListingQuery = {
  category?: string;
  seller?: string;
  product?: string;
  status?: string;
  condition?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  limit?: string;
  sort?: string;
};

export async function createListing(data: any, userId: string) {
  return Listing.create({
    ...data,
    sellerId: userId, // ✅ always from JWT
  });
}

export async function getListings(query: ListingQuery) {
  const filter: any = {};

  if (query.category) filter.categoryId = query.category;
  if (query.seller) filter.sellerId = query.seller;
  if (query.product) filter.productId = query.product;
  if (query.status) filter.status = query.status;
  if (query.condition) filter.condition = query.condition;

  // Simple keyword search on title/description
  if (query.q) {
    filter.$or = [
      { title: { $regex: query.q, $options: "i" } },
      { description: { $regex: query.q, $options: "i" } },
    ];
  }

  // Price filters require product populated fields; better approach:
  // Option A: store price on Listing too. Option B: aggregation.
  // For now: ignore min/max unless you add price to listing.

  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100);
  const skip = (page - 1) * limit;

  // Sort examples:
  // sort=createdAt_desc | createdAt_asc
  // sort=title_asc
  const sortMap: Record<string, any> = {
    createdAt_desc: { createdAt: -1 },
    createdAt_asc: { createdAt: 1 },
    title_asc: { title: 1 },
    title_desc: { title: -1 },
  };
  const sort = sortMap[query.sort || "createdAt_desc"] ?? { createdAt: -1 };

  const [items, total] = await Promise.all([
    Listing.find(filter)
      // hide seller email while populating:
      .populate("sellerId", "name") // only return name (no email)
      .populate("categoryId", "name")
      .populate("productId") // can also limit fields: .populate("productId", "name price description")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getListingById(id: string) {
  return Listing.findById(id)
    .populate("sellerId", "name")
    .populate("categoryId", "name")
    .populate("productId");
}

export async function updateListing(id: string, data: any, userId: string) {
  const listing = await Listing.findById(id);
  if (!listing) throw new AppError("Listing not found", 404);

  if (listing.sellerId.toString() !== userId) {
    throw new AppError("Not allowed", 403);
  }

  const { sellerId, ...safe } = data; // prevent changing sellerId
  return Listing.findByIdAndUpdate(id, safe, { new: true, runValidators: true });
}

export async function deleteListing(id: string, userId: string) {
  const listing = await Listing.findById(id);
  if (!listing) throw new AppError("Listing not found", 404);

  if (listing.sellerId.toString() !== userId) {
    throw new AppError("Not allowed", 403);
  }

  return Listing.findByIdAndDelete(id);
}

export async function getMyListings(userId: string, query: ListingQuery) {
  // Force seller filter to the logged-in user
  return getListings({ ...query, seller: userId });
}