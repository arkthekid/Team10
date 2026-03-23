import { Schema, model } from "mongoose";

const sellerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    umassEmail: { type: String, required: true, trim: true, unique: true },
    dob: { type: Date }, // optional
  },
  { timestamps: true }
);

export default model("Seller", sellerSchema);