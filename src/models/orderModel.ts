import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: String,
  cartItems: [
    {
      productId: String,
      title: String,
      price: String,
      image: String,
      salePrice: Number,
      quantity: Number,
    },
  ],
  address: {
    addressId: String,
    address: String,
    city: String,
    pincode: String,
    phone: String,
    notes: String,
  },
  orderStatus: String,
  paymentMethod: String,
  paymentStatus: String,
  totalAmount: Number,
  orderDate: {
    type: Date,
    default: Date.now,
  },
  // orderUpdateDate: Date,
  cartId: String,
  // paymentId: String,
  // payerId: String,
});

export default mongoose.model("Order", orderSchema);
