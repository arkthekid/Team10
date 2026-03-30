import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

const Category = model<ICategory>("Category", categorySchema);

export default Category;