import { Request, Response } from "express";
import addressModel from "../models/addressModel";
import { getCurrentUserId } from "../utils/currentUserId";
export const addAddressController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getCurrentUserId(req.headers.authorization as string);
    const { address, city, pincode, phone, notes } = req.body;
    if (!address || !city || !pincode || !phone) {
      res.status(400).json("Missing required fields");
      return;
    }

    const newAddress = new addressModel({
      userId,
      address,
      city,
      pincode,
      phone,
      notes,
    });
    await newAddress.save();
    res.status(201).json(newAddress);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};

export const updateAddressController = async (req: Request, res: Response) => {
  try {
    const { userId, id } = req.params;
    const { address, city, pincode, phone, notes } = req.body;
    if (!userId || !id || !address || !city || !pincode || !phone) {
      res.status(400).json("Missing required fields");
      return;
    }
    const updatedAddress = await addressModel.findByIdAndUpdate(
      id,
      { userId, address, city, pincode, phone, notes },
      { new: true }
    );
    updatedAddress?.save();
    if (!updatedAddress) {
      res.status(404).json("Address not found");
      return;
    }
    res.status(200).json(updatedAddress);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
    return;
  }
};
export const deleteAddressController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedAddress = await addressModel.findByIdAndDelete(id);
    if (!deletedAddress) {
      res.status(404).json("Address not found");
      return;
    }
    res.status(200).json({
      message: "Address deleted successfully",
      data: deletedAddress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
    return;
  }
};

export const fetchAllAddressController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization;
    const address = await addressModel.find({
      userId: getCurrentUserId(token as string),
    });
    if (!address) {
      res.status(404).json("Address not found");
      return;
    }
    res.status(200).json(address);
  } catch (error) {
    console.log(error);
    res.status(500).json("An error occurred");
  }
};
