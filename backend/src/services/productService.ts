import { IProduct, Product } from "../models/Product";

interface CreateProductInput {
    name: String;
    productID: Number;
    listingID: Number;
    categoryID: Number;
    price: Number;
}

export const createProductService = async (data: CreateProductInput): Promise<IProduct> => {
    const product = new Product(data);
    return await product.save();
}

export const getAllProducts = async (): Promise<IProduct[]> => {
    const products = await Product.find({});

    if (!products.length) {
        throw new Error("No products found");
    }

    return products;
}

export const getProduct = async (productID: Number) => {
    
}

export const updateProduct = () => {}

export const deleteProduct = () => {}