import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as listingService from "../services/listingService";
import { getUserId } from "../utils/getUserId";
import { GetListingDto } from "../dto/getListing.dto";

export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const newListing = await listingService.createListing(req.body, userId);

    res.status(201).json(newListing);
  } catch (error) {
    next(error);
  }
};


export const getListings = async (req: Request<{}, {}, {}, GetListingDto>, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      category, // can be undefined
      sortBy = "createdAt", // if sortBy is undefined → use "createdAt"
      order = "DESC", // if order is undefined → use "DESC"
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    const listings = await listingService.getListings({
      sortBy,
      order,
      page: Number(page),
      limit: Number(limit),

      ...(search && { search }),
      ...(category && { category }), // only add if it is undefined

      ...(minPrice !== undefined && {
        minPrice: Number(minPrice),
      }),

      ...(maxPrice !== undefined && {
        maxPrice: Number(maxPrice),
      }),
    });

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

export const getListingById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Listing id is required", 400));
    }

    const listing = await listingService.getListingById(id); 
    
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};


export const updateListing = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Listing id is required", 400));
    }

    const userId = getUserId(req);
    const updated = await listingService.updateListing(id, req.body, userId);
    
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};


export const deleteListing = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Listing id is required", 400));
    }

    const userId = getUserId(req);
    await listingService.deleteListing(id, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};


export const getMyListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const listings = await listingService.getMyListings(userId);

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

export const markAsSold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = getUserId(req);
    const { conversationId: conversationId } = req.params;

    const updatedListing = await conversationService.markAsSold(sellerId, conversationId);

    res.status(200).json(updatedListing);
  }
  catch (error) {
    next(error);
  }
}
