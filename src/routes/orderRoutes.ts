import express from "express";
import {
  addOrderController,
  capturePayment,
  createOrder,
  getUserOrder,
  updateOrderStatus,
} from "../controllers/orderController";
const router = express.Router();
router.post("/addOrder", addOrderController);
router.post("/create", createOrder);
router.post("/capture", capturePayment);
router.get("/getUserOrder", getUserOrder);
router.put("/updateOrderStatus/:id", updateOrderStatus);
// router.post("update/OrderStatus", updateOrderStatus);
export default router;
