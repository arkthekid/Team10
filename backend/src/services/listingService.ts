import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/data-source";
import { Listing } from "../entities/Listing";
import { User } from "../entities/User";
import { GetListingDto } from "../dto/getListing.dto";
import { Conversation } from "../entities/Conversation";

export async function createListing(data: Partial<Listing>, userId: string) {
  const listingRepository = AppDataSource.getRepository(Listing);

  const listing = listingRepository.create(data);
  listing.seller = { id: userId } as User;

  return await listingRepository.save(listing);
}

export async function getListings(query: GetListingDto) {
  const repo = AppDataSource.getRepository(Listing);
  const qb = repo.createQueryBuilder("listing");

  if (query.category) {
    qb.where("listing.category = :category", {
      category: query.category,
    });
  }

  if (query.minPrice !== undefined) {
    qb.andWhere("listing.price >= :minPrice", {
      minPrice: query.minPrice,
    });
  }

  if (query.maxPrice !== undefined) {
    qb.andWhere("listing.price <= :maxPrice", {
      maxPrice: query.maxPrice,
    });
  }

  if (query.search) {
    qb.andWhere(
      "listing.name ILIKE :search OR listing.description ILIKE :search",
      {
        search: `%${query.search}%`,
      }
    );
  }

  qb.orderBy(
    `listing.${query.sortBy || "createdAt"}`,
    query.order || "DESC"
  );

  const page = query.page || 1;
  const limit = query.limit || 10;

  qb.skip((page - 1) * limit).take(limit);

  return await qb.getMany();
}

export async function getListingById(id: string) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId: id },
  });

  if (!listing) throw new AppError("Listing not found", 404);

  return listing;
}

export async function updateListing(
  id: string,
  data: Partial<Listing>,
  userId: string
) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId: id },
    relations: ["seller"],
  });

  if (!listing) throw new AppError("Listing not found", 404);
  if (listing.seller.id !== userId) throw new AppError("Unauthorized", 403);

  delete data.listingId;
  delete (data as any).seller;
  delete (data as any).sellerId;

  Object.assign(listing, data);

  return await repo.save(listing);
}

export async function deleteListing(id: string, userId: string) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId: id },
  });

  if (!listing) throw new AppError("Listing not found", 404);
  if (listing.seller.id !== userId) throw new AppError("Unauthorized", 403);

  await repo.remove(listing);

  return { message: "Listing deleted successfully" };
}

export async function getMyListings(userId: string) {
  const repo = AppDataSource.getRepository(Listing);

  return await repo.find({
    where: { seller: { id: userId } },
  });
}

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
