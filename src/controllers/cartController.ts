import { Request, Response } from "express";
import cartModel from "../models/cartModel";
import productModel from "../models/productModel";
import { Types } from "mongoose";
import userModel from "../models/userModel";
import { getCurrentUserId } from "../utils/currentUserId";
interface IProduct {
  _id: Types.ObjectId;
  image: string;
  title: string;
  price: number;
  salePrice: number;
}

interface ICartItem {
  productId: IProduct;
  quantity: number;
  _id: Types.ObjectId;
}

interface TransformedCartItem {
  productId: Types.ObjectId;
  title: string;
  image: string;
  price: number;
  salePrice: number;
  quantity: number;
}

interface CartResponse {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: TransformedCartItem[];
}

export const addToCartController = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json("Unauthorized");
      return;
    }
    if (!productId || !quantity) {
      res.status(400).json("Missing required fields");
      return;
    }
    const product = await productModel.findById(productId);
    if (!product) {
      res.status(400).json("Product not found in databse");
      return;
    }
    const userId = getCurrentUserId(token);
    let cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      cart = new cartModel({
        userId,
        items: [],
      });
    }
    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (findCurrentProductIndex === -1) {
      cart.items.push({ productId, quantity });
    } else {
      cart.items[findCurrentProductIndex].quantity += quantity;
    }
    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};

export const fetchCartController = async (
  req: Request<{}, {}, {}, { userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json("Unauthorized");
      return;
    }
    const userId = getCurrentUserId(token);
    const cart = await cartModel
      .findOne({ userId })
      .populate<{ items: ICartItem[] }>({
        path: "items.productId",
        select: "image title price salePrice",
      });

    if (!cart) {
      res.status(400).json("Cart not found in database");
      return;
    }

    const items: TransformedCartItem[] = cart.items.map((item) => ({
      productId: item.productId._id,
      title: item.productId.title,
      image: item.productId.image,
      price: item.productId.price,
      salePrice: item.productId.salePrice,
      quantity: item.quantity,
    }));

    const response: CartResponse = {
      _id: cart._id,
      userId: cart.userId,
      items,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};

export const updateCartItemQuantityController = async (
  req: Request,
  res: Response
) => {
  try {
    const { productId, quantity } = req.body;
    const token = req.headers.authorization;
    if (!token) {
      res.status(401).json("Unauthorized");
      return;
    }
    const userId = getCurrentUserId(token);
    if (!userId || !productId || !quantity) {
      res.status(400).json("Missing required fields");
      return;
    }

    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      res.status(400).json("Cart not found in database");
      return;
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (findCurrentProductIndex === -1) {
      res.status(400).json("Product not found in cart");
      return;
    } else {
      if (quantity === "plus") {
        cart.items[findCurrentProductIndex].quantity += 1;
        await cart.save();
      } else {
        if (cart.items[findCurrentProductIndex].quantity === 1) {
          cart.items.splice(findCurrentProductIndex, 1);
          await cart.save();
          // console.log(cart.items[findCurrentProductIndex].quantity);
          res.status(200).json(cart);
          return;
        }
        cart.items[findCurrentProductIndex].quantity = cart.items[
          findCurrentProductIndex
        ].quantity -= 1;
        await cart.save();
      }
      res.status(200).json(cart);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};

export const deleteCartItemController = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const token = req.headers.authorization;
    const userId = getCurrentUserId(token as string);
    if (!productId) {
      res.status(400).json("Missing required fields");
      return;
    }
    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      res.status(400).json("User not found in database");
    }

    const cart = await cartModel.findOne({ userId: user?._id });
    if (!cart) {
      res.status(400).json("Cart not found in database");
      return;
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (findCurrentProductIndex === -1) {
      res.status(400).json("Product not found in cart");
      return;
    } else {
      cart.items.splice(findCurrentProductIndex, 1);
      await cart.save();
      res.status(200).json(cart);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("An error occurred");
  }
};
