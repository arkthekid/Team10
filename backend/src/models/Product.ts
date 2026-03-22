import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string,
    productID: number,
    listingID: number,
    categoryID: number,
    price: number,
}

const productSchema = new Schema<IProduct>({
    name: { type: String, required: true }, 
    productID: { type: Number, required: true },
    listingID: { type: Number, required: true },
    categoryID: { type: Number, required: true },
    price: { type: Number, required: true }
})

export const Product = model<IProduct>("Product", productSchema);


