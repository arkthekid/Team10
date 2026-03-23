// src/controllers/listingController.ts
import mongoose from "mongoose";
import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import * as listingService from "../services/listingService";
import { asyncHandler } from "../middleware/asyncHandler";

function getParam(req: Request, key: string): string {
  const val = (req.params as any)[key] as unknown;
  if (typeof val === "string" && val.length > 0) return val;
  throw new AppError(`Invalid or missing param: ${key}`, 400);
}

// Read user id set by protect middleware
function getUserId(req: Request): string {
  const user = (req as any).user as { _id?: any } | undefined;
  const id = user?._id?.toString?.();
  if (!id) throw new AppError("Unauthorized", 401);
  return id;
}

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  // sellerId comes from JWT (ignore any sellerId client sends)
  const listing = await listingService.createListing(req.body, userId);
  res.status(201).json(listing);
});

export const getListings = asyncHandler(async (req: Request, res: Response) => {
  const result = await listingService.getListings(req.query as any);
  res.json(result);
});

export const getListingById = asyncHandler(async (req: Request, res: Response) => {
  const id = String((req.params as any).id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid listing id", 400);
  }

  const listing = await listingService.getListingById(id);
  if (!listing) throw new AppError("Listing not found", 404);

  res.json(listing);
});

export const updateListing = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid listing id", 400);

  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new AppError("Unauthorized", 401);

  const updated = await listingService.updateListing(id, req.body, userId);
  res.json(updated);
});

export const deleteListing = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError("Invalid listing id", 400);

  const userId = (req as any).user?._id?.toString();
  if (!userId) throw new AppError("Unauthorized", 401);

  await listingService.deleteListing(id, userId);
  res.status(204).send();
});

export const getMyListings = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const result = await listingService.getMyListings(userId, req.query as any);
  res.json(result);
});