import express from "express";
import {
  getAllProductsController,
  getCategoriesController,
  getCategoryDataController,
  getLatestProductsController,
  getProductDetailsController,
  getSimilarProductsController,
  saveProductController,
  searchProductsController,
} from "../controllers/productController";
const router = express.Router();
router.get("/getCategory", getCategoriesController);
router.get("/", getAllProductsController);
router.get("/product/:id", getProductDetailsController);
router.get("/save/:id", saveProductController);
router.get("/search", searchProductsController);
router.get("/:category", getCategoryDataController);
router.get("/getSimilarProducts/:id", getSimilarProductsController);
router.get("/latestProducts/get", getLatestProductsController);
export default router;
