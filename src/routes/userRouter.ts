import express from "express";
import {
  loginController,
  logoutController,
  registerController,
  userDetailsController,
  userSavedItemsController,
} from "../controllers/authController";
import {
  forgotPasswordController,
  resetPasswordController,
  verifyOtpController,
} from "../controllers/forgetPasswordController";
const router = express.Router();
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/details", userDetailsController);
router.get("/savedItem", userSavedItemsController);
router.post("/forgot-password", forgotPasswordController);
router.post("/verify-otp", verifyOtpController);
router.post("/reset-password", resetPasswordController);
export default router;
