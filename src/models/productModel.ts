import mongoose from "mongoose";
const quantityDiscountSchema = new mongoose.Schema({
  minQuantity: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
});
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
    limitedStock: {
      type: Number,
      default: -1,
    },
    quantityDiscounts: {
      type: [quantityDiscountSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
