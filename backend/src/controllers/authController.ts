import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import * as authService from "../services/authService";
import * as googleAuthService from "../services/googleAuthService";
import { AppError } from "../utils/AppError";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return res.json(result);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  return res.json(req.user);
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError("Google ID token is required", 400);
  const result = await googleAuthService.googleLogin(idToken);
  return res.json(result);
});