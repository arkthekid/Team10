import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { JwtPayload } from "../utils/jwt";
import { AppDataSource } from "../config/data-source";


export function signToken(user: { id: string, email: string, role: JwtPayload["role"]}): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) throw new Error("JWT_SECRET is not defined");

  if (!expiresIn) throw new Error("JWT_EXPIRES_IN is not defined");

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, secret,
    { expiresIn: expiresIn as NonNullable<jwt.SignOptions["expiresIn"]> }
  );
}

export async function register(data: { name: string; umassEmail: string; password: string }) {
  if (!data.umassEmail.endsWith("@umass.edu")) {
    throw new AppError("Must use a @umass.edu email", 400);
  }

  const userRepo = AppDataSource.getRepository(User);

  // check if email already exists
  const existing = await userRepo.findOne({ where: { umassEmail: data.umassEmail } });
  if (existing) throw new AppError("Email already registered", 409);

  // 🔥 reduce bcrypt cost in test mode to avoid timeout
  const rounds = process.env.NODE_ENV === "test" ? 4 : 12;
  const passwordHash = await bcrypt.hash(data.password, rounds);

  // create and save user
  const user = userRepo.create({
    name: data.name,
    umassEmail: data.umassEmail,
    passwordHash,
  });

  await userRepo.save(user);

  const token = signToken({
    id: user.id.toString(),
    email: user.umassEmail,
    role: user.role as "user" | "admin",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      umassEmail: user.umassEmail,
      role: user.role,
    },
  };
}

export async function login(data: { umassEmail: string; password: string }) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { umassEmail: data.umassEmail } }); // ✅ TypeORM
  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const token = signToken({
    id: user.id.toString(), // ✅ TypeORM uses id not _id
    email: user.umassEmail,
    role: user.role as "user" | "admin",
  });

  return {
    token,
    user: {
      id: user.id, // ✅ not _id
      name: user.name,
      umassEmail: user.umassEmail,
      role: user.role,
    },
  };
}