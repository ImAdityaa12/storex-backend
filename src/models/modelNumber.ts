import mongoose from "mongoose";

const modelNumber = new mongoose.Schema(
  {
    model: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
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

export default mongoose.model("Model", modelNumber);
