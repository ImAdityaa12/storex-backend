import express from "express";
import {
  addBrandContoller,
  addCategoryController,
  addModelController,
  addNewProductController,
  deleteProductController,
  deleteTagController,
  getFilteredProductsController,
  getOrderController,
  getProductDetailsController,
  getProductsController,
  getProductsStocksController,
  getproductTagsController,
  getUsersController,
  handleImageUploadController,
  updateProductController,
} from "../controllers/admin/productsController";
import { upload } from "../utils/cloudinary";
import {
  updateUserApprovalController,
  updateUserCreditController,
  updateUserRoleController,
} from "../controllers/admin/userController";
// import { updateOrderStatus } from "../controllers/orderController";
const router = express.Router();
router.get("/", async (req, res) => {
  res.json("admin route");
});
router.post(
  "/upload/image",
  upload.single("image"),
  handleImageUploadController
);
router.get("/users", getUsersController);
router.get("/getProducts", getProductsController);
router.post("/addNewProduct", addNewProductController);
router.delete("/deleteProduct/:id", deleteProductController);
router.put("/updateProduct/:id", updateProductController);
router.get("/filter", getFilteredProductsController);
router.get("/detail", getProductDetailsController);
router.get("/orders", getOrderController);
router.put("/updateRole/:id", updateUserRoleController);
router.put("/updateCredit/:id", updateUserCreditController);
router.put("/updateApproval/:id", updateUserApprovalController);
router.post("/addModel", addModelController);
router.post("/addCategory", addCategoryController);
router.post("/addBrand", addBrandContoller);
router.get("/productTags", getproductTagsController);
router.delete("/deleteTag/:title", deleteTagController);
router.get("/getProductStock", getProductsStocksController);

// router.post("order/update", updateOrderStatus);
export default router;
