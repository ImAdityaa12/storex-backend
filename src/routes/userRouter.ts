import express from "express";
import {
  loginController,
  logoutController,
  registerController,
  userDetailsController,
  userSavedItemsController,
} from "../controllers/authController";
const router = express.Router();
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/details", userDetailsController);
router.get("/savedItem", userSavedItemsController);
export default router;
