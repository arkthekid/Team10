import { IProduct, Product } from "../models/productModels";

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

export const getProductByID = async (id: String): Promise<IProduct> => {
    const product = await Product.findById(id);
    if (!product) {
        throw new Error("Product not found");
    }
    return product;
}

export const updateProduct = async (
    id: string,
    fields: Partial<IProduct>,
): Promise<IProduct> => {
    const product = await Product.findByIdAndUpdate(
        id,
        { $set: fields },
        { new: true, runValidators: true },
    );

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
};

export const deleteProduct = async (id: String): Promise<void> => {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
        throw new Error("Product not found");
    }
}