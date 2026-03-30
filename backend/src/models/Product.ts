import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  categoryId: Types.ObjectId;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);