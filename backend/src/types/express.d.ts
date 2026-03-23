import type { IUser } from "../models/User"; // adjust if you export user type
// If you don't have IUser exported, we can type it minimally instead.

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: any;
        name: string;
        umassEmail: string;
        role: string;
      };
    }
  }
}

export {};