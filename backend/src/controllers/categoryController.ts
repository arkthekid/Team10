import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/AppError";
import * as categoryService from "../services/categoryService";

export async function createCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const { categoryName } = req.body;

        if (!categoryName) throw new AppError("Category name required", 400);

        const category = await categoryService.createCategory(categoryName);
        return res.status(201).json(category);
    }
    catch (error) {
        next(error);
    }
}