import express from "express";
import {
  addToCartController,
  deleteCartItemController,
  fetchCartController,
  updateCartItemCustomQuantityController,
  updateCartItemQuantityController,
} from "../controllers/cartController";
const router = express.Router();
router.get("/", fetchCartController);
router.post("/addToCart", addToCartController);
router.post("/updateCartItemQuantity", updateCartItemQuantityController);
router.put(
  "/updateCartItemCustomQuantity",
  updateCartItemCustomQuantityController
);
router.delete("/deleteCartItem", deleteCartItemController);
export default router;
