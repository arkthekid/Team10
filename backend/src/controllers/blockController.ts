import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { getUserId } from "../utils/getUserId";
import * as blockService from "../services/blockService";

export const blockUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("User id is required", 400));
    }

    const blockerId = getUserId(req);
    const result = await blockService.blockUser(blockerId, id);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyBlockedUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const blockerId = getUserId(req);
    const blockedUsers = await blockService.getMyBlockedUsers(blockerId);

    res.status(200).json(blockedUsers);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("User id is required", 400));
    }

    const blockerId = getUserId(req);
    await blockService.unblockUser(blockerId, id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};