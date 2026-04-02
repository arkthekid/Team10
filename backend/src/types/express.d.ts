import { JwtPayload } from "../utils/jwt";
import { User } from "../entities/User";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};