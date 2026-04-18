import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { JwtPayload } from "../utils/jwt";
import { AppDataSource } from "../config/data-source";

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
  // Normalize input so whitespace and uppercase emails do not cause issues
  const name = data.name?.trim();
  const umassEmail = data.umassEmail?.trim().toLowerCase();
  const password = data.password;

  // Validate required fields before doing any other checks
  if (!name || !umassEmail || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  // Restrict registration to UMass emails only
  if (!umassEmail.endsWith("@umass.edu")) {
    throw new AppError("Must use a @umass.edu email", 400);
  }

  // Enforce a minimum password length
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const userRepo = AppDataSource.getRepository(User);

  // Check whether the email is already registered
  const existing = await userRepo.findOne({ where: { umassEmail } });
  if (existing) throw new AppError("Email already registered", 409);

  // Reduce bcrypt cost in test mode so tests run faster
  const rounds = process.env.NODE_ENV === "test" ? 4 : 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  // Create and save the new user with a hashed password
  const user = userRepo.create({
    name,
    umassEmail,
    passwordHash,
  });

  await userRepo.save(user);

  // Sign JWT using the newly created user data
  const token = signToken({
    id: user.id.toString(),
    email: user.umassEmail,
    role: user.role as "user" | "admin",
  });

  // Return safe user info only
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
  // Normalize email before querying the database
  const umassEmail = data.umassEmail?.trim().toLowerCase();
  const password = data.password;

  // Validate required login fields
  if (!umassEmail || !password) {
    throw new AppError("Email and password are required", 400);
  }

  // Find user by normalized email
  const userRepo = AppDataSource.getRepository(User);

  // Defensive check: reject invalid or malformed user records
  const user = await userRepo.findOne({ where: { umassEmail } });
  if (!user || !user.passwordHash) throw new AppError("Invalid credentials", 401);

  // Compare plaintext password with stored hash
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  // Sign JWT for the authenticated user
  const token = signToken({
    id: user.id.toString(),
    email: user.umassEmail,
    role: user.role as "user" | "admin",
  });

  // Return safe user info only
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

export async function logout() {
  return
}
