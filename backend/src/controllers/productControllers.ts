import { Request, Response, NextFunction } from "express";
import * as productService from "../services/productService";

export const createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { name, productID, listingID, categoryID, price } = req.body;

        const product = await productService.createProductService({
            name,
            productID, 
            listingID,
            categoryID,
            price
        })

        res.status(201).json({
            message: "Product created!",
            data: product,
        })
    } catch (error) {
        next(error);
    }
}

export const getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const products = await productService.getAllProducts();

        res.status(200).json({
            success: true,
            message: "Get all products!",
            data: products,
        })
    }
    catch (error) {
        next(error);
    }
}

export const getProductByID = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const product = await productService.getProductByID(id);

        res.status(200).json({
            success: true,
            message: "Get product details!",
            data: product,
        })
    }
    catch (error) {
        next(error);
    }
}

export const updateProduct = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updatedProduct = await productService.updateProduct(id, req.body);

        res.status(200).json({
            success: true,
            message: "Product updated successfully!",
            data: updatedProduct,
        })
    }
    catch (error) {
        next(error);
    }
}

export const deleteProduct = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await productService.deleteProduct(id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully!",
            data: null,
        })
    }
    catch (error) {
        next(error);
    }
}