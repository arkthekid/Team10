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

export async function updateListing(id: string, data: Partial<Listing>, userId: string) { // enable partial updates by allowing only some fields to be provided, which is good for update
  const repo = AppDataSource.getRepository(Listing); // access the Listing table

  const listing = await repo.findOne({ // this will get the exact listing to update
    where: { listingId: id },
  });

  if (!listing) throw new AppError("Listing not found", 404); // listing must exist
  if (listing.sellerId !== userId) throw new AppError("Unauthorized", 403); // only the owner can update

  delete data.sellerId;   // do not allow updating sellerId (ownership must stay the same)
  delete data.listingId;  // do not allow updating listingId (primary key should never change)

  Object.assign(listing, data); // this will copy allowed updated fields onto the existing listing.

  return await repo.save(listing); // return the updated listing
}

export async function deleteListing(id: string, userId: string) {
  const repo = AppDataSource.getRepository(Listing); // access the Listing table

  const listing = await repo.findOne({ // get the listing by ID
    where: { listingId: id },
  });

  if (!listing) throw new AppError("Listing not found", 404); // return 404 if not found
  if (listing.sellerId !== userId) throw new AppError("Unauthorized", 403); // only owner can delete

  await repo.remove(listing); // delete listing from DB

  return { message: "Listing deleted successfully" }; // confirmation
}

export async function getMyListings(userId: string) {
  const repo = AppDataSource.getRepository(Listing);
  
  return await repo.find({
    where: {sellerId: userId}
  })
}