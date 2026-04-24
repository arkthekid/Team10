import { AppDataSource } from "../config/data-source";
import { AppError } from "../utils/AppError";
import { Favorite } from "../entities/Favorite";
import { Listing } from "../entities/Listing";

export async function addFavorite(userId: string, listingId: string) {
  const favoriteRepo = AppDataSource.getRepository(Favorite);
  const listingRepo = AppDataSource.getRepository(Listing);

  const listing = await listingRepo.findOne({
    where: { listingId },
  });

  if (!listing) {
    throw new AppError("Listing not found", 404);
  }

  const existingFavorite = await favoriteRepo.findOne({
    where: { userId, listingId },
    relations: ["listing"]
  });

  if (existingFavorite) {
    throw new AppError("Listing is already in favorites", 409);
  }

  if (userId == listing.sellerId) {
    throw new AppError("Cannot favorite your listing", 409);
  }

  const favorite = favoriteRepo.create({
    userId,
    listingId,
  });

  await favoriteRepo.save(favorite);

  return {
    message: "Listing favorited successfully",
    favorite,
  };
}

export async function getMyFavorites(userId: string) {
  const favoriteRepo = AppDataSource.getRepository(Favorite);

  const favorites = await favoriteRepo.find({
    where: { userId },
    relations: ["listing"],
    order: { createdAt: "DESC" },
  });

  return favorites.map((favorite) => favorite.listing);
}

export async function removeFavorite(userId: string, listingId: string) {
  const favoriteRepo = AppDataSource.getRepository(Favorite);

  const favorite = await favoriteRepo.findOne({
    where: { userId, listingId },
  });

  if (!favorite) {
    throw new AppError("Favorite not found", 404);
  }

  await favoriteRepo.remove(favorite);

  return { message: "Favorite removed successfully" };
}