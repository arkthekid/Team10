import { Request, Response, NextFunction } from "express";
import * as productService from "../services/productServices";

export const createProduct = async (
    req: Request,
    res: Response,
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
        console.log(error);
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