import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { JwtPayload } from "../utils/jwt";
import { AppDataSource } from "../config/data-source";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "./emailService";

export function signToken(user: { id: string; email: string; role: JwtPayload["role"] }): string {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) throw new Error("JWT_SECRET is not defined");
  if (!expiresIn) throw new Error("JWT_EXPIRES_IN is not defined");

  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as NonNullable<jwt.SignOptions["expiresIn"]>,
  });
}

export async function register(data: { name: string; umassEmail: string; password: string }) {
  const name = data.name?.trim();
  const umassEmail = data.umassEmail?.trim().toLowerCase();
  const password = data.password;

  if (!name || !umassEmail || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  if (!umassEmail.endsWith("@umass.edu")) {
    throw new AppError("Must use a @umass.edu email", 400);
  }

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { umassEmail } });
  if (existing) throw new AppError("Email already registered", 409);

  const rounds = process.env.NODE_ENV === "test" ? 4 : 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  const verificationToken = uuidv4();

  const user = userRepo.create({
    name,
    umassEmail,
    passwordHash,
    isVerified: false,
    verificationToken,
  });

  await userRepo.save(user);

  // Send verification email
  await sendVerificationEmail(umassEmail, verificationToken);

  return {
    message: "Registration successful! Please check your email to verify your account.",
    user: {
      id: user.id,
      name: user.name,
      umassEmail: user.umassEmail,
      role: user.role,
    },
  };
}

export async function login(data: { umassEmail: string; password: string }) {
  const umassEmail = data.umassEmail?.trim().toLowerCase();
  const password = data.password;

  if (!umassEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { umassEmail } });
  if (!user || !user.passwordHash) throw new AppError("Invalid credentials", 401);

  // Check if user has verified their email
  if (!user.isVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

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

export async function verifyEmail(token: string) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { verificationToken: token } });

  if (!user) throw new AppError("Invalid or expired verification token", 400);

  user.isVerified = true;
  user.verificationToken = null;

  await userRepo.save(user);

  const jwtToken = signToken({
    id: user.id,
    email: user.umassEmail,
    role: user.role as "user" | "admin",
  });

  return {
    token: jwtToken,
    user: {
      id: user.id,
      name: user.name,
      umassEmail: user.umassEmail,
      role: user.role,
    },
  };
}

export async function logout() {
  return;
}