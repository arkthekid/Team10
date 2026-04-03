import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { JwtPayload } from "../utils/jwt"; // ✅ CHANGED: use your custom JWT payload type instead of generic jwt.JwtPayload

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }

    const token = header.split(" ")[1]; // ✅ CHANGED: simplified token extraction (no need for extra array variable)

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const payload = jwt.verify(token, secret) as JwtPayload; 
    // ✅ CHANGED: cast to your own JwtPayload type instead of jwt.JwtPayload
    // ensures payload has correct fields: id, email, role

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.id } });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user.id.toString(),
      email: user.umassEmail,
      role: user.role as "user" | "admin", // (same, but now consistent with JwtPayload typing)
    };

    return next(); // ✅ CHANGED: explicitly return next() (cleaner control flow)
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}