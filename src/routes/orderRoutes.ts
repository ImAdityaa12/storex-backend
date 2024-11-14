import express from "express";
import {
  addOrderController,
  capturePayment,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController";
const router = express.Router();
router.post("/addOrder", addOrderController);
router.post("/create", createOrder);
router.post("/capture", capturePayment);
// router.post("update/OrderStatus", updateOrderStatus);
export default router;
