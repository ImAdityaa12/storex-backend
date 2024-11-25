import mongoose from "mongoose";

const brandModel = new mongoose.Schema(
  {
    brand: String,
    modelId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Model",
      },
    ],
    productId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    categoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Brand", brandModel);
