import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: any; // mongoose ObjectId
        name: string;
        umassEmail: string;
        role: string;
      };
    }
  }
}

export {};