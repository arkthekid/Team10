import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/data-source";
import { Listing } from "../entities/Listing";

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

export async function getListings(query: ListingQuery) {
  
}

export async function getListingById(id: string) {
  
}

export async function updateListing(id: string, data: any, userId: string) {
  
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
    where: {sellerId: userId}
  })
}