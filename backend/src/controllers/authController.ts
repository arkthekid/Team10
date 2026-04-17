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
<<<<<<< HEAD
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json({
    message: "Logged out successfully",
  });
=======
>>>>>>> 1e1330c5bca129a452dff4527f2aa4016a805df5
});