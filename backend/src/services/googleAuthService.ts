import { OAuth2Client } from "google-auth-library";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { signToken } from "./authService";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(idToken: string) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) throw new AppError("Google Client ID not configured", 500);

  // Verify the Google token
  const ticket = await client.verifyIdToken({
    idToken,
    audience: googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new AppError("Invalid Google token", 401);

  const { email, name } = payload;

  if (!email || !name) throw new AppError("Google account missing email or name", 400);

  // UMass only
  if (!email.endsWith("@umass.edu")) {
    throw new AppError("Must use a @umass.edu Google account", 403);
  }

  const userRepo = AppDataSource.getRepository(User);

  // Find existing user or create a new one
  let user = await userRepo.findOne({ where: { umassEmail: email } });

  if (!user) {
    user = userRepo.create({
      name,
      umassEmail: email,
      passwordHash: "",
      role: "user",
    });
    await userRepo.save(user);
  }

  const token = signToken({
    id: user.id,
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