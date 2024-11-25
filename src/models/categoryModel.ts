import mongoose from "mongoose";

const categoryModel = new mongoose.Schema(
  {
    category: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
    },
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Category", categoryModel);
