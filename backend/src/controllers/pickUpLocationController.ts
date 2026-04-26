import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as pickUpLocationService from "../services/pickUpLocationService";

export const createPickUpLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;

    if (!name) {
      return next(new AppError("Name is required", 400));
    }

    const location = await pickUpLocationService.createPickUpLocation(name);
    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
};

export const getAllPickUpLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locations = await pickUpLocationService.getAllPickUpLocations();
    res.status(200).json(locations);
  } catch (error) {
    next(error);
  }
};