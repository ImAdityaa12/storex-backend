import express from "express";
import {
  addAddressController,
  deleteAddressController,
  fetchAllAddressController,
  updateAddressController,
} from "../controllers/addressController";
const router = express.Router();
router.get("/all", fetchAllAddressController);
router.post("/add", addAddressController);
router.put("/update/:userId/:id", updateAddressController);
router.delete("/delete/:id", deleteAddressController);

export default router;
