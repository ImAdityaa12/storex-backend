import express from "express";
import {
  getAllProductsController,
  getProductDetailsController,
  saveProductController,
  searchProductsController,
} from "../controllers/productController";
const router = express.Router();
router.get("/", getAllProductsController);
router.get("/product/:id", getProductDetailsController);
router.get("/save/:id", saveProductController);
router.get("/search", searchProductsController);
export default router;
