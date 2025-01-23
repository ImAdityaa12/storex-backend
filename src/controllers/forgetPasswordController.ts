import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import userModel from "../models/userModel";

// Store OTPs in memory
const otpStore: Record<
  string,
  {
    otp: string;
    createdAt: number;
    attempts: number;
  }
> = {};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP with creation time and attempt tracking
    otpStore[email] = {
      otp,
      createdAt: Date.now(),
      attempts: 0,
    };

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_ACCOUNT_EMAIL,
        pass: process.env.NODEMAILER_ACCOUNT_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_ACCOUNT_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const storedOtp = otpStore[email];

    // Validation checks
    if (!storedOtp) {
      res.status(400).json({ message: "No OTP request found" });
      return;
    }

    // Check OTP expiration (10 minutes)
    const isExpired = Date.now() - storedOtp.createdAt > 10 * 60 * 1000;

    // Check max attempts (3 attempts)
    const maxAttemptsExceeded = storedOtp.attempts >= 3;

    if (isExpired) {
      delete otpStore[email];
      res.status(400).json({ message: "OTP has expired" });
      return;
    }

    if (maxAttemptsExceeded) {
      delete otpStore[email];
      res
        .status(400)
        .json({ message: "Max OTP verification attempts exceeded" });
      return;
    }

    // Increment attempts
    storedOtp.attempts++;

    // Verify OTP
    if (storedOtp.otp !== otp) {
      res.status(400).json({
        message: "Invalid OTP",
        remainingAttempts: 3 - storedOtp.attempts,
      });
      return;
    }

    // Clear OTP after successful verification
    delete otpStore[email];

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    // Ensure OTP was recently verified (you might want to add additional verification)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userModel.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};
