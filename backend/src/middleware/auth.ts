import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const parts = header.split(" ");
    const token = parts[1];

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const payload = jwt.verify(token, secret) as jwt.JwtPayload;

    const user = await User.findById(payload.sub).select("_id name umassEmail role");
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}