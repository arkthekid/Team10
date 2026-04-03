import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/data-source";
import { Listing } from "../entities/Listing";
import { GetListingDto } from "../dto/getListing.dto";

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

export async function createListing(data: Partial<Listing>, userId: string) {
  const listingRepository = AppDataSource.getRepository(Listing);

  const listing = listingRepository.create(data);
  listing.sellerId = userId;

  return await listingRepository.save(listing);
}

export async function getListings(query: GetListingDto) {
  const repo = AppDataSource.getRepository(Listing);

  const qb = repo.createQueryBuilder("listing");

  // filtering
  if (query.category) {
    qb.where("listing.category = :category", {
      category: query.category,
    });
  }

  if (query.minPrice) {
    qb.andWhere("listing.price >= :minPrice", {
      minPrice: query.minPrice,
    });
  }

  if (query.maxPrice) {
    qb.andWhere("listing.price <= :maxPrice", {
      maxPrice: query.maxPrice,
    });
  }

  qb.orderBy(
    `listing.${query.sortBy || "createdAt"}`,
    query.order || "DESC",
  );

  const page = query.page || 1;
  const limit = query.limit || 10;

  qb.skip((page - 1) * limit).take(limit);

  return await qb.getMany();
}

export async function getListingById(id: string) {
  
}

export async function updateListing(id: string, data: any, userId: string) {
  
}

export async function deleteListing(id: string, userId: string) {
  const repo = AppDataSource.getRepository(Listing);

  const listing = await repo.findOne({
    where: { listingId: id }
  })
  if (!listing) throw new Error("Listing not found");
  if (listing.sellerId !== userId) throw new Error("Unauthorized");

  await repo.remove(listing)
}

export async function getMyListings(userId: string) {
  const repo = AppDataSource.getRepository(Listing);
  
  return await repo.find({
    where: {sellerId: userId}
  })
}