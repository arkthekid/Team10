import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as favoriteService from "../services/favoriteService";
import { getUserId } from "../utils/getUserId";

export const addFavorite = async (
  req: Request<{ listingId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { listingId } = req.params;

    if (!listingId) {
      return next(new AppError("Listing id is required", 400));
    }

    const userId = getUserId(req);
    const favorite = await favoriteService.addFavorite(userId, listingId);

    res.status(201).json(favorite);
  } catch (error) {
    next(error);
  }
};

export const getMyFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getUserId(req);
    const favorites = await favoriteService.getMyFavorites(userId);

    res.status(200).json(favorites);
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (
  req: Request<{ listingId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { listingId } = req.params;

    if (!listingId) {
      return next(new AppError("Listing id is required", 400));
    }

    const userId = getUserId(req);
    await favoriteService.removeFavorite(userId, listingId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};