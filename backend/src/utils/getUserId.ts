import { AppError } from "./AppError";
import { Request } from "express";

export function getUserId(req: Request): string {
    if (!req.user?.id) {
        throw new AppError("Unauthorized", 401);
    }
    return req.user.id;
}