import express from "express";
import {
  addNewProductController,
  deleteProductController,
  getFilteredProductsController,
  getOrderController,
  getProductDetailsController,
  getProductsController,
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
// router.post("order/update", updateOrderStatus);
export default router;
