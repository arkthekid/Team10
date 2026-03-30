import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../utils/AppError";
import * as transactionService from "../services/transactionService";

function getUserId(req: Request): string {
  const user = (req as any).user as { _id?: any } | undefined;
  const id = user?._id?.toString?.();
  if (!id) throw new AppError("Unauthorized", 401);
  return id;
}

function getParam(req: Request, key: string): string {
  const val = (req.params as any)[key] as unknown;

  if (typeof val === "string" && val.length > 0) return val;

  throw new AppError(`Invalid or missing param: ${key}`, 400);
}

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const transaction = await transactionService.createTransaction(
    {
      listingId: req.body.listingId,
      finalPrice: req.body.finalPrice,
    },
    userId
  );

  res.status(201).json(transaction);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const result = await transactionService.getTransactions(userId, req.query as any);
  res.json(result);
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const id = getParam(req, "id");

  const transaction = await transactionService.getTransactionById(id, userId);
  res.json(transaction);
});

export const updateTransactionStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const id = getParam(req, "id");

  const updated = await transactionService.updateTransactionStatus(
    id,
    req.body.status,
    userId
  );

  res.json(updated);
});