import mongoose from "mongoose";
interface QuantityDiscount {
  minQuantity: number;
  discountedPrice: number;
}
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
    quantityDiscounts: {
      type: [quantityDiscountSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
