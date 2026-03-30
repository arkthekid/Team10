import { Schema, model, Types } from "mongoose";

const listingSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Types.ObjectId, ref: "Category", required: true },

    title: { type: String, required: true, trim: true },
    pickUpLocation: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "pending", "sold", "removed"],
      default: "active",
    },
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
      default: "good",
    },
    isNegotiable: { type: Boolean, default: false },
  },
  { timestamps: true } // createdAt, updatedAt
);

export default model("Listing", listingSchema);