import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

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

    // ✅ TypeORM lookup using id from payload
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.id } });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user.id.toString(),
      email: user.umassEmail,
      role: user.role as "user" | "admin",
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}