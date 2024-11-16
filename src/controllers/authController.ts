import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { generateToken } from "../utils/generateToken";
import jwt from "jsonwebtoken";
import cartModel from "../models/cartModel";
import { getCurrentUserId } from "../utils/currentUserId";
export const registerController = async (req: Request, res: Response) => {
  try {
    const { name, userName, email, password, phoneNumber, image } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      userName,
      email,
      password: hash,
      name,
      phoneNumber,
      image,
    });
    const token = generateToken(email, user);
    res.cookie("token", token);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the user." });
  }
};
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await userModel.findOne({ email });

    if (!user || !user.password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(email, user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Required for HTTPS
      sameSite: "none", // Required for cross-domain cookies
      maxAge: 24 * 60 * 60 * 1000, // Cookie expiry (e.g., 24 hours)
      // Don't set domain unless you specifically need to
    });

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred while logging in" });
  }
};

export const logoutController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "An error occurred while logging out" });
  }
};
export const userDetailsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const cleanToken = token.replace("Bearer ", "");
    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_KEY as string
    ) as jwt.JwtPayload;
    const email = decoded.email;
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      image: user.image,
      phoneNumber: user.phoneNumber,
      userName: user.userName,
      role: user.role,
      _id: user._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
};

export const userSavedItemsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const cleanToken = token.replace("Bearer ", "");
    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_KEY as string
    ) as jwt.JwtPayload;
    const email = decoded.email;

    const user = await userModel
      .findOne({ email })
      .populate("savedProduct")
      .exec();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Send the populated saved products as response
    res.status(200).json(user.savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
};

export const getCartItems = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
  } catch (error) {
    console.log(error);
  }
};
