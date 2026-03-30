import { IProduct, Product } from "../models/Product";
import { Types } from "mongoose";

interface CreateProductInput {
  name: string;
  categoryId: Types.ObjectId;
  price: number;
}

export const createProductService = async (
  data: CreateProductInput
): Promise<IProduct> => {
  const product = new Product({
    name: data.name,
    categoryId: data.categoryId,
    price: data.price,
  });

  return await product.save();
};

export const getAllProducts = async (): Promise<IProduct[]> => {
  const products = await Product.find({}).populate("categoryId", "name");

  if (!products.length) {
    throw new Error("No products found");
  }

  return products;
};

export const getProductByID = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id).populate("categoryId", "name");

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const updateProduct = async (
  id: string,
  fields: Partial<IProduct>
): Promise<IProduct> => {
  const product = await Product.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true, runValidators: true }
  ).populate("categoryId", "name");

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new Error("Product not found");
  }
};