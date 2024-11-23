import { Request, Response } from "express";
import productModel from "../models/productModel";
import userModel from "../models/userModel";
import { getCurrentUserId } from "../utils/currentUserId";

export const getAllProductsController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const user = await userModel.findOne({ _id: getCurrentUserId(token) });
    const category = req.query.category as string;
    const brands = req.query.brands as string;
    const cleanCategory = category?.replace(/"/g, "");
    const cleanBrands = brands?.replace(/"/g, "");
    if (!cleanCategory && !cleanBrands) {
      const allProduct = await productModel.find().sort({ price: 1 });
      const userLikedProducts = allProduct.map((product) =>
        user?.savedProduct.includes(product._id)
          ? {
              product,
              isLiked: true,
            }
          : {
              product,
              isLiked: false,
            }
      );
      res.status(200).json(userLikedProducts);
      return;
    } else if (cleanCategory && !cleanBrands) {
      const filteredProduct = await productModel
        .find({
          category: { $regex: cleanCategory, $options: "i" },
        })
        .sort({ price: 1 });
      res.json({ filteredProduct });
    } else if (!cleanCategory && cleanBrands) {
      const filteredProduct = await productModel
        .find({
          brand: { $regex: cleanBrands, $options: "i" },
        })
        .sort({ price: 1 });
      res.json({ filteredProduct });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
};

export const getProductDetailsController = async (
  req: Request,
  res: Response
) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findById(productId);
    res.status(200).json({ product });
  } catch (error) {
    console.log(error);
    res.status(500).json("Some error occured");
  }
};
export const saveProductController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const productId = req.params.id;
    const product = await productModel.findById(productId);
    const user = await userModel.findOne({ _id: getCurrentUserId(token) });
    if (!user) {
      res.status(400).json("User not found in database");
      return;
    }
    if (product && product._id) {
      if (user.savedProduct.includes(product._id)) {
        user.savedProduct.splice(user.savedProduct.indexOf(product._id), 1);
      } else {
        user.savedProduct.push(product._id);
      }
      await user.save();
      res.status(200).json({ user });
      return;
    } else {
      res.status(404).json("Product not found");
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json("Some error occurred");
    return;
  }
};

export const searchProductsController = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const filteredProducts = await productModel.find({
      $or: [
        { title: { $regex: new RegExp(query, "i") } },
        { brand: { $regex: new RegExp(query, "i") } },
        { category: { $regex: new RegExp(query, "i") } },
        { description: { $regex: new RegExp(query, "i") } },
      ],
    });
    res.json(filteredProducts);
    return;
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while searching products" });
  }
};

export const getCategoryDataController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization as string;
    const user = await userModel.findOne({ _id: getCurrentUserId(token) });
    const category = req.params.category as string;
    const cleanCategory = category?.replace(/"/g, "");
    const filteredProduct = await productModel
      .find({
        category: { $regex: cleanCategory, $options: "i" },
      })
      .sort({ price: 1 });
    const products: {
      product: any;
      isLiked: boolean;
    }[] = filteredProduct.map((product) =>
      user?.savedProduct.includes(product._id)
        ? {
            product,
            isLiked: true,
          }
        : {
            product,
            isLiked: false,
          }
    );
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while searching products" });
  }
};

export const getSimilarProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization as string;
    const user = await userModel.findOne({ _id: getCurrentUserId(token) });
    if (!user) {
      res.status(400).json("User not found in database");
      return;
    }
    const productId = req.params.id as string;
    const product = await productModel.findById(productId);
    const category = product?.category;
    const cleanCategory = category?.replace(/"/g, "").split(",") || [];
    const filteredProduct = await productModel
      .find({
        category: { $regex: cleanCategory.join("|"), $options: "i" },
      })
      .sort({ price: 1 });
    let products: {
      product: any;
      isLiked: boolean;
    }[] = filteredProduct.map((product) =>
      user?.savedProduct.includes(product._id)
        ? {
            product,
            isLiked: true,
          }
        : {
            product,
            isLiked: false,
          }
    );
    products = products.filter(
      (product) => product.product._id.toString() !== productId
    );
    if (products.length < 10) {
      res.status(200).json({ products: products.slice(0, 10) });
      return;
    } else {
      res.status(200).json({ products });
      return;
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while searching products" });
  }
};
export const getLatestProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization as string;
    const user = await userModel.findOne({ _id: getCurrentUserId(token) });
    if (!user) {
      res.status(400).json("User not found in database");
      return;
    }
    const filteredProduct = await productModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10);
    let products: {
      product: any;
      isLiked: boolean;
    }[] = filteredProduct.map((product) =>
      user?.savedProduct.includes(product._id)
        ? {
            product,
            isLiked: true,
          }
        : {
            product,
            isLiked: false,
          }
    );
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while searching products" });
  }
};
