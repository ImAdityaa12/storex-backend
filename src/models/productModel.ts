import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
    price: Number,
    brand: String,
    category: String,
    model: {
      type: String,
      default: "",
    },
    salePrice: Number,
    totalStock: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
