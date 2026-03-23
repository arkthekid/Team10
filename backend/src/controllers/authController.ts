import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as authService from "../services/authService.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});