import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  approved: {
    type: Boolean,
    default: false,
  },
  credit: {
    type: Number,
    default: 0,
  },
  savedProduct: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: "Product",
  },
});

export default mongoose.model("User", userSchema);
