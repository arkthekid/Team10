import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as listingService from "../services/listingService";
import { getUserId } from "../utils/getUserId";
import { GetListingDto } from "../dto/getListing.dto";

export const createListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { categoryIds, ...data } = req.body;

    const newListing = await listingService.createListing(data, categoryIds, userId);

    res.status(201).json(newListing);
  } catch (error) {
    next(error);
  }
};


export const getListings = async (req: Request<{}, {}, {}, GetListingDto>, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      category,
      sortBy = "createdAt",
      order = "DESC",
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let currentUserId = "";
    try {
      currentUserId = getUserId(req as any);
    } catch {
      currentUserId = "";
    }

    const listings = await listingService.getListings({
      sortBy,
      order,
      page: Number(page),
      limit: Number(limit),

      ...(search && { search }),
      ...(category && { category }),

      ...(minPrice !== undefined && {
        minPrice: Number(minPrice),
      }),

      ...(maxPrice !== undefined && {
        maxPrice: Number(maxPrice),
      }),
    }, currentUserId);

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

export const getListingStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const status = await listingService.getListingStatus(id);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};
export const getListingsByUserId = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) throw new AppError("User Id is required", 400);

    const listings = await listingService.getListingsByUserId(id);
    return res.status(200).json(listings);
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

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    const orders = await listingService.getMyOrders(userId);

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
}