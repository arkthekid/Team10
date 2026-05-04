import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/data-source";
import { Listing } from "../entities/Listing";
import { User } from "../entities/User";
import { GetListingDto } from "../dto/getListing.dto";
import { Conversation } from "../entities/Conversation";
import { CategoryEntity } from "../entities/Category";
import { getBlockerIdsForUser } from "./blockService";

export async function createListing(data: Partial<Listing>, categoriesIDs: string[], userId: string) {
  const listingRepository = AppDataSource.getRepository(Listing);
  const categoryRepository = AppDataSource.getRepository(CategoryEntity);

  const categories = await categoryRepository.findBy(
    categoriesIDs.map(id => ({ categoryId: id }))
  );

  const listing = listingRepository.create(data);
  listing.sellerId = userId;
  listing.categories = categories;

  return await listingRepository.save(listing);
}

export async function getListings(query: GetListingDto, currentUserId: string) {
  const repo = AppDataSource.getRepository(Listing);
  const qb = repo.createQueryBuilder("listing");

  qb.leftJoinAndSelect("listing.pickUpLocation", "pickUpLocation");

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

  // hide listings from users who blocked the current user
  const blockerIds = await getBlockerIdsForUser(currentUserId);
  if (blockerIds.length > 0) {
    qb.andWhere("listing.sellerId NOT IN (:...blockerIds)", {
      blockerIds,
    });
  }

  qb.orderBy(
    `listing.${query.sortBy || "createdAt"}`,
    query.order || "DESC"
  );

  // const page = query.page || 1;
  // const limit = query.limit || 9;

  // qb.skip((page - 1) * limit).take(limit);

  return await qb.getMany();
}

export async function getListingById(id: string) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId: id },
    relations: ["seller", "categories", "images", "pickUpLocation"]
  });

  if (!listing) throw new AppError("Listing not found", 404);

  const cntConversation = await AppDataSource.getRepository(Conversation).count({
    where: { listingId: id }
  })

  return {
    listingId: listing.listingId,
    name: listing.name,
    price: listing.price,
    condition: listing.condition,
    categories: listing.categories.map(c => c.name),
    status: listing.status,
    description: listing.description,
    images: listing.images,
    ownerId: listing.sellerId,
    sellerName: listing.seller.name,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    pickUpLocation: listing.pickUpLocation.name,
    cntInterestedUser: cntConversation,
  }
}

export async function getListingStatus(listingId: string) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId },
  });

  if (!listing) throw new AppError("Listing not found", 404);

  return {
    listingId: listing.listingId,
    status: listing.status,
    sellerMarkedSoldAt: listing.sellerMarkedSoldAt,
    buyerMarkedReceivedAt: listing.buyerMarkedReceivedAt,
  };
};

export async function getListingsByUserId(userId: string) {
  const repo = AppDataSource.getRepository(Listing);

  const listings = repo.findBy({ sellerId: userId });

  return listings;
}

export async function updateListing(
  id: string,
  data: Partial<Listing>,
  userId: string
) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId: id }
  });

  if (!listing) throw new AppError("Listing not found", 404);
  if (listing.sellerId !== userId) throw new AppError("Unauthorized", 403);

  // prevent updating protected fields
  delete (data as any).listingId;
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
  if (listing.sellerId !== userId) throw new AppError("Unauthorized", 403);

  await repo.remove(listing);

  return { message: "Listing deleted successfully" };
}

export async function getMyListings(userId: string) {
  const repo = AppDataSource.getRepository(Listing);

  return await repo.find({
    where: { sellerId: userId },
  });
}

export async function getMyOrders(userId: string) { // just filtered listing
  const repo = AppDataSource.getRepository(Listing);

  return await repo.find({
    where: { buyerId: userId },
    relations: ["seller", "images"]
  })
}
