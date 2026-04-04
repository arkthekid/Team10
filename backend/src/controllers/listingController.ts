import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as listingService from "../services/listingService";
import { getUserId } from "../utils/getUserId";


export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const newListing = await listingService.createListing(req.body, userId);

    res.status(201).json(newListing);
  } catch (error) {
    next(error);
  }
};


export const getListings = async (req: Request<{}, {}, {}, Record<string, any>>, res: Response, next: NextFunction) => {
  try {
    const listings = await listingService.getListings(req.query);

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

    const listing = await listingService.getListingById(id); // do we need to verify the user????
    
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
}


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
}


export const deleteListing = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Listing id is required", 400));
    }

    const userId = getUserId(req);

    await listingService.deleteListing(id, userId);

    res.status(204).json(null);
  } catch (error) {
      next(error);
  }
}


export const getMyListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const listings = await listingService.getMyListings(userId);

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};