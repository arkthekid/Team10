import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AppError } from "../utils/AppError";

export function signToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!expiresIn) {
    throw new Error("JWT_EXPIRES_IN is not defined");
  }

  return jwt.sign(
    { sub: userId },
    secret,
    { expiresIn: expiresIn as NonNullable<jwt.SignOptions["expiresIn"]> }
  );
}

export async function register(data: { name: string; umassEmail: string; password: string }) {
  if (!data.umassEmail.endsWith("@umass.edu")) {
    throw new AppError("Must use a @umass.edu email", 400);
  }

  const existing = await User.findOne({ umassEmail: data.umassEmail });
  if (existing) throw new AppError("Email already registered", 409);

  // 🔥 reduce bcrypt cost in test mode to avoid timeout
  const rounds = process.env.NODE_ENV === "test" ? 4 : 12;

  const passwordHash = await bcrypt.hash(data.password, rounds);

  const user = await User.create({
    name: data.name,
    umassEmail: data.umassEmail,
    passwordHash,
  });

  const token = signToken(user._id.toString());

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      umassEmail: user.umassEmail,
      role: user.role,
    },
  };
}

export async function login(data: { umassEmail: string; password: string }) {
  const user = await User.findOne({ umassEmail: data.umassEmail });
  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const token = signToken(user._id.toString());

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      umassEmail: user.umassEmail,
      role: user.role,
    },
  };
}