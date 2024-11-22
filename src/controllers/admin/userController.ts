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
