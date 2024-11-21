import express from "express";
import {
  getAllProductsController,
  getCategoryDataController,
  getProductDetailsController,
  saveProductController,
  searchProductsController,
} from "../controllers/productController";
const router = express.Router();
router.get("/", getAllProductsController);
router.get("/product/:id", getProductDetailsController);
router.get("/save/:id", saveProductController);
router.get("/search", searchProductsController);
router.get("/:category", getCategoryDataController);
export default router;
