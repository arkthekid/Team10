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


export async function getAllCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const categories = await categoryService.getAllCategory();
        return res.status(201).json(categories);
    }
    catch (error) {
        next(error);
    }
}

export async function getCategoryById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(id);
        return res.status(200).json(category);
    }
    catch (error) {
        next(error);
    }
}

export async function updateCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) throw new AppError("Name is required", 400);
        const category = await categoryService.updateCategory(id, name);
        return res.status(200).json(category);
    }
    catch (error) {
        next(error);
    }
}

export async function deleteCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        return res.status(200).json(await categoryService.deleteCategory(id));
    }
    catch (error) {
        next(error);
    }
}