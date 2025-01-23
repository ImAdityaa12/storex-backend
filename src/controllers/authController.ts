import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { generateToken } from "../utils/generateToken";
import jwt from "jsonwebtoken";
import { calculateDiscount } from "../utils/calculateDiscount";
import nodemailer from "nodemailer";
export const registerController = async (req: Request, res: Response) => {
  try {
    const { name, userName, email, password, phoneNumber, image } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    const uniquePhoneNumber = await userModel.findOne({ phoneNumber });
    if (uniquePhoneNumber) {
      res.status(400).json({ message: "Phone number already exists" });
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
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email provider (e.g., 'gmail', 'yahoo', 'hotmail', etc.)
      auth: {
        user: "adityagupta1291@gmail.com", // Your email address
        pass: process.env.NODEMAILER_ACCOUNT_PASS, // Your email password or app password
      },
    });

    const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                .container { background-color: #f4f4f4; border-radius: 8px; padding: 30px; text-align: center; }
                .welcome-title { color: #333; }
                .welcome-message { color: #666; line-height: 1.6; }
                .user-details { background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .cta-button {
                    display: inline-block;
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="welcome-title">Welcome, ${name}!</h1>
                <p class="welcome-message">
                    Your account has been successfully created. 
                    We're excited to have you on board.
                </p>
                <div class="user-details">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>User Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phoneNumber}</p>
                </div>
                <a href="https://yourwebsite.com/login" class="cta-button">Login Now</a>
            </div>
        </body>
        </html>
        `;

    const mailOptions = {
      from: process.env.NODEMAILER_ACCOUNT_EMAIL,
      to: email,
      subject: "Order Placed Successfully",
      html: htmlTemplate,
    };
    await transporter.sendMail(mailOptions);
    const adminHtmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #f4f4f4; border-radius: 8px; padding: 30px; text-align: center; }
            .welcome-title { color: #333; }
            .welcome-message { color: #666; line-height: 1.6; }
            .user-details { background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .cta-button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="welcome-title">Hello, Admin!</h1> 
            <p class="welcome-message">
                A new user has been registered.
            </p>
            <div class="user-details">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>User Name:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phoneNumber}</p>  
            </div>
        </div>
    </body>
    </html>
    `;
    const adminMailOptions = {
      from: process.env.NODEMAILER_ACCOUNT_EMAIL,
      to: "adityagupta1291@gmail.com",
      subject: "New user registered",
      html: adminHtmlTemplate,
    };
    await transporter.sendMail(adminMailOptions);
    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the user." });
  }
};
export const loginController = async (req: Request, res: Response) => {
  try {
    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    let user;
    if (phoneOrEmail.includes("@")) {
      user = await userModel.findOne({ email: phoneOrEmail });
    } else {
      user = await userModel.findOne({ phoneNumber: phoneOrEmail });
    }
    if (!user || !user.password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.email, user);
    res.status(200).json({ message: "Logged in successfully", token });
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
      approved: user.approved,
      credit: user.credit,
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
    const products = user.savedProduct.map((product: any) => {
      return {
        product,
        isLiked: true,
        discount: calculateDiscount(product.price ?? 0, product.salePrice ?? 0),
      };
    });
    // Send the populated saved products as response
    res.status(200).json(products);
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
