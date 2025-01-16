import { Request, Response } from "express";
import cartModel from "../models/cartModel";
import productModel from "../models/productModel";
import { Types } from "mongoose";
import userModel from "../models/userModel";
import { getCurrentUserId } from "../utils/currentUserId";
import console from "console";
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
  price?: number;
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
  total: number;
}
const calculateDiscountedProductQuantityPrice = (
  minQuantiyPrice: {
    minQuantity: number;
    discountedPrice: number;
  }[],
  currentQuantity: number,
  perPiecePrice: number
) => {
  if (minQuantiyPrice.length === 0) {
    return perPiecePrice * currentQuantity;
  }
  const sortedMinQuantiyPrice = minQuantiyPrice.sort(
    (a, b) => b.minQuantity - a.minQuantity
  );

  // Find the first matching discount tier
  const matchingDiscount = sortedMinQuantiyPrice.find(
    (discountQuantiyAndPrice) =>
      currentQuantity >= discountQuantiyAndPrice.minQuantity
  );

  if (matchingDiscount) {
    const remainingPieces = currentQuantity % matchingDiscount.minQuantity;
    // console.log("here");
    const remainingPiecesPrice = remainingPieces * perPiecePrice;
    // console.log(currentQuantity);
    // console.log(remainingPieces);
    const itemQuantitySets = Math.floor(
      currentQuantity / matchingDiscount.minQuantity
    );
    // console.log(itemQuantitySets);
    const itemQuantitySetsPrice =
      itemQuantitySets * matchingDiscount.discountedPrice;
    return remainingPiecesPrice + itemQuantitySetsPrice;
  }
  // console.log("here again");
  return perPiecePrice * currentQuantity;
};
export const addToCartController = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, minQuantityFlag } = req.body;
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
      res.status(400).json("Product not found in database");
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
    if (!minQuantityFlag) {
      if (findCurrentProductIndex === -1) {
        cart.items.push({
          price: product.salePrice,
          productId,
          quantity: 1,
        });
        await cart.save();
        res.status(201).json(cart.items);
        return;
      } else {
        cart.items[findCurrentProductIndex].quantity += quantity;
        await cart.save();
        res.status(201).json(cart.items);
        return;
      }
    } else {
      if (findCurrentProductIndex === -1) {
        cart.items.push({
          productId,
          quantity,
          price: calculateDiscountedProductQuantityPrice(
            product.quantityDiscounts,
            quantity,
            product.salePrice ?? 0
          ),
        });
        await cart.save();
        res.status(201).json(cart.items);
        return;
      } else {
        res.json("Product Quantity already in cart");
        return;
      }
    }
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
      res.status(201).json({ items: [], userId });
      return;
    }

    const items: TransformedCartItem[] = cart.items.map((item) => ({
      productId: item.productId._id,
      title: item.productId.title,
      image: item.productId.image,
      originalPrice: item.productId.salePrice * item.quantity,
      price: item.price || item.productId.price,
      salePrice: item.productId.salePrice,
      quantity: item.quantity,
    }));
    const total = items.reduce((acc, item) => acc + item.price, 0);
    const response: CartResponse = {
      _id: cart._id,
      userId: cart.userId,
      items,
      total,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};

const calculateItemDiscountedPrice = (
  quantityDiscounts:
    | {
        minQuantity: number;
        discountedPrice: number;
      }[]
    | undefined,
  quantity: number,
  productPrice: number
): { price: number; matched: boolean } => {
  if (quantityDiscounts?.length === 0 || quantityDiscounts === undefined) {
    return { price: productPrice, matched: false };
  }
  const currentQuantity = quantity;
  let price = 0;
  let matched = false;
  quantityDiscounts.forEach(
    (discount: { minQuantity: number; discountedPrice: number }) => {
      if (discount.minQuantity < currentQuantity) {
        price = discount.discountedPrice / discount.minQuantity;
      } else if (discount.minQuantity === currentQuantity) {
        console.log("Real", currentQuantity);
        price = calculateDiscountedProductQuantityPrice(
          quantityDiscounts ?? [],
          currentQuantity,
          productPrice
        );
        matched = true;
      }
    }
  );
  return {
    price: price === 0 ? productPrice : price,
    matched,
  };
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
        const product = await productModel.findById(productId);
        const discountedPrice: {
          price: number;
          matched: boolean;
        } = calculateItemDiscountedPrice(
          product?.quantityDiscounts,
          cart.items[findCurrentProductIndex].quantity + 1,
          product?.salePrice ?? product?.price ?? 0
        );
        cart.items[findCurrentProductIndex].quantity += 1;
        if (
          cart.items[findCurrentProductIndex].price &&
          !discountedPrice.matched
        ) {
          cart.items[findCurrentProductIndex].price +=
            discountedPrice.price ?? product?.salePrice ?? product?.price ?? 0;
        } else if (
          cart.items[findCurrentProductIndex].price &&
          discountedPrice.matched
        ) {
          cart.items[findCurrentProductIndex].price =
            discountedPrice.price ?? product?.salePrice ?? product?.price ?? 0;
        }
        await cart.save();
      } else {
        if (cart.items[findCurrentProductIndex].quantity === 1) {
          cart.items.splice(findCurrentProductIndex, 1);
          await cart.save();
          res.status(200).json(cart);
          return;
        }
        const product = await productModel.findById(productId);
        const discountedPrice: {
          price: number;
          matched: boolean;
        } = calculateItemDiscountedPrice(
          product?.quantityDiscounts,
          cart.items[findCurrentProductIndex].quantity - 1,
          product?.salePrice ?? product?.price ?? 0
        );
        cart.items[findCurrentProductIndex].quantity -= 1;
        if (
          cart.items[findCurrentProductIndex].price &&
          !discountedPrice.matched
        ) {
          cart.items[findCurrentProductIndex].price -=
            discountedPrice.price ?? product?.salePrice ?? product?.price ?? 0;
        } else if (
          cart.items[findCurrentProductIndex].price &&
          discountedPrice.matched
        ) {
          cart.items[findCurrentProductIndex].price =
            discountedPrice.price ?? product?.salePrice ?? product?.price ?? 0;
        }
        await cart.save();
      }
      res.status(200).json(cart);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};
export const updateCartItemCustomQuantityController = async (
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
      if (typeof quantity === "number") {
        const product = await productModel.findById(productId);
        const discountedPrice = calculateDiscountedProductQuantityPrice(
          product?.quantityDiscounts ?? [],
          quantity,
          product?.salePrice ?? product?.price ?? 0
        );
        cart.items[findCurrentProductIndex].quantity = quantity;
        cart.items[findCurrentProductIndex].price = discountedPrice;
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
