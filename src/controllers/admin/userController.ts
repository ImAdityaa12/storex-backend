import { Request, Response } from "express";
import userModel from "../../models/userModel";
import { getCurrentUserId } from "../../utils/currentUserId";
export const updateUserRoleController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const { role } = req.body;
    await userModel.findByIdAndUpdate(id, { role }, { new: true });
    res.json({ message: "User role updated successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
    return;
  }
};

export const updateUserCreditController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const { credit } = req.body;
    const { action } = req.query;
    if (action === "add") {
      await userModel.findByIdAndUpdate(
        id,
        { $inc: { credit } },
        { new: true }
      );
      res.json({ message: "User credit updated successfully" });
      return;
    }
    if (action === "minus") {
      await userModel.findByIdAndUpdate(
        id,
        { $inc: { credit: -credit } },
        { new: true }
      );
      res.json({ message: "User credit updated successfully" });
      return;
    }
    await userModel.findByIdAndUpdate(id, { credit }, { new: true });
    res.json({ message: "User credit updated successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
    return;
  }
};

export const updateUserApprovalController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { id } = req.params;
    const { approved } = req.body;
    await userModel.findByIdAndUpdate(id, { approved }, { new: true });
    res.json({ message: "User approval status updated successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
    return;
  }
};
