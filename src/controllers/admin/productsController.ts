import { Request, Response } from "express";
import { imageUploadUtil } from "../../utils/cloudinary";
import productModel from "../../models/productModel";
import orderModel from "../../models/orderModel";
import userModel from "../../models/userModel";
import { getCurrentUserId } from "../../utils/currentUserId";
import modelNumber from "../../models/modelNumber";
import categoryModel from "../../models/categoryModel";
import brandModel from "../../models/brandModel";
import { models } from "mongoose";
import console from "console";

export const getProductsController = async (req: Request, res: Response) => {
  try {
    const products = await productModel.find();
    res.json({ products });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
};
export const handleImageUploadController = async (
  req: Request,
  res: Response
) => {
  try {
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const url = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await imageUploadUtil(url);
      res.json({ result });
      return;
    }
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while uploading the image" });
    return;
  }
};

export const addNewProductController = async (req: Request, res: Response) => {
  try {
    const {
      image,
      title,
      description,
      price,
      brand,
      category,
      model,
      salePrice,
      totalStock,
      discounts,
      limitedStock,
    } = req.body;
    const product = await productModel.create({
      image,
      title,
      description,
      price,
      brand,
      category,
      model,
      salePrice,
      totalStock,
      limitedStock,
      quantityDiscounts: discounts,
    });
    await product.save();
    res.json({ product });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the product" });
  }
};

export const deleteProductController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productModel.findByIdAndDelete(id);
    res.json({ product });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the product" });
  }
};
export const updateProductController = async (req: Request, res: Response) => {
  try {
    await productModel.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the product" });
  }
};

export const getFilteredProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const category = req.query.category as string;
    const brands = req.query.brands as string;
    const cleanCategory = category?.replace(/"/g, "");
    const cleanBrands = brands?.replace(/"/g, "");
    if (!cleanCategory && !cleanBrands) {
      const filteredProduct = await productModel
        .find({
          category: { $regex: cleanCategory, $options: "i" },
          $and: [{ brand: { $regex: cleanBrands, $options: "i" } }],
        })
        .sort({ price: 1 });
      res.json({ filteredProduct });
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
    const id = req.query.id;
    const product = await productModel.findById(id);
    res.json({ product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
};

export const getOrderController = async (req: Request, res: Response) => {
  try {
    const orders = await orderModel
      .find()
      .populate("userId", "name userName")
      .exec();
    res.json({ orders: orders.reverse() });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
};

export const getUsersController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || "newest";

    // Build search query
    let searchQuery: any = { _id: { $ne: userId } }; // Exclude current admin user
    if (search) {
      searchQuery = {
        ...searchQuery,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      };
    }

    // Build sort query
    let sortQuery: any = {};
    switch (sortBy) {
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "oldest":
        sortQuery = { createdAt: 1 };
        break;
      case "name":
        sortQuery = { name: 1 };
        break;
      case "email":
        sortQuery = { email: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 }; // Default to newest
    }

    const totalUsers = await userModel.countDocuments(searchQuery);
    const users = await userModel
      .find(searchQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching users" });
  }
};

export const addModelController = async (req: Request, res: Response) => {
  try {
    const { model, image } = req.body;
    if (!model) {
      res.status(400).json({ message: "Model are required" });
      return;
    }
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const existingModel = await modelNumber.findOne({ model });
    if (existingModel) {
      res.status(409).json({ message: "Model already exists" });
      return;
    }
    const createdModel = await modelNumber.create({ model, image });

    if (!createdModel) {
      res.status(500).json({ message: "Failed to create model" });
      return;
    }
    res.json({ message: `${model} created successfully` });
    return;
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "An error occurred" });
    return;
  }
};

export const addCategoryController = async (req: Request, res: Response) => {
  try {
    const { category, image } = req.body;
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);

    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const existingModel = await categoryModel.findOne({ category });
    if (existingModel) {
      res.status(409).json({ message: "Category already exists" });
      return;
    }
    const createdCategory = await categoryModel.create({ category, image });

    if (!createdCategory) {
      res.status(500).json({ message: "Failed to create category" });
      return;
    }

    res.status(201).json({ message: `${category} created successfully` });
    return;
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "An error occurred" });
    return;
  }
};

export const addBrandContoller = async (req: Request, res: Response) => {
  try {
    const { brands } = req.body;
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!Array.isArray(brands)) {
      res.status(400).json({ message: "brands must be provided as an array" });
      return;
    }

    const results = {
      success: [] as string[],
      duplicates: [] as string[],
      errors: [] as string[],
    };

    for (const brand of brands) {
      try {
        const existingBrand = await brandModel.findOne({ brand });
        if (existingBrand) {
          results.duplicates.push(brand);
          continue;
        }

        const createdbrand = await brandModel.create({ brand });

        if (createdbrand) {
          results.success.push(brand);
        }
      } catch (error) {
        results.errors.push(brand);
        console.error(`Error processing Category ${brand}:`, error);
      }
    }
    const response = {
      message: "Categories processing completed",
      details: {
        successfullyAdded: results.success,
        alreadyExisting: results.duplicates,
        failedToAdd: results.errors,
      },
      summary: {
        total: models.length,
        successful: results.success.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length,
      },
    };

    res.json(response);
    return;
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ message: "An error occurred" });
    return;
  }
};

export const getproductTagsController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const brands = await brandModel.find();
    const categories = await categoryModel.find();
    const models = await modelNumber.find();
    res.json({
      brands: brands.map((brand) => brand.brand),
      categories: categories.map((category) => category.category),
      models: models.map((model) => model.model),
    });
    return;
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
};

export const deleteTagController = async (req: Request, res: Response) => {
  const { title } = req.params;
  const { tag } = req.query;
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (tag === "brands") {
      const brand = await brandModel.findOne({ brand: title });
      if (!brand) {
        res.status(404).json({ message: `${title} not found` });
        return;
      }
      await brandModel.deleteOne({ brand: title });
      res.json({ message: `${title} deleted successfully` });
      return;
    }

    if (tag === "categories") {
      const category = await categoryModel.findOne({ category: title });
      if (!category) {
        res.status(404).json({ message: `${title} not found` });
        return;
      }
      await categoryModel.deleteOne({ category: title });
      res.json({ message: `${title} deleted successfully` });
      return;
    }

    if (tag === "models") {
      const model = await modelNumber.findOne({ model: title });
      if (!model) {
        res.status(404).json({ message: "Model not found" });
        return;
      }
      await modelNumber.deleteOne({ model: title });
      res.json({ message: `${title} deleted successfully` });
      return;
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

export const getProductsStocksController = async (
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { model: { $regex: search, $options: "i" } }
        ]
      };
    }

    const products = await productModel
      .find(searchQuery)
      .select("title totalStock category image model limitedStock")
      .sort({ totalStock: 1 });

    const limitedStockProduct = products.filter((product) => {
      if (product.totalStock && product.limitedStock !== -1) {
        if (product.totalStock < product.limitedStock) return product;
      }
    });

    const emptyProducts = products.filter(
      (product) => product.totalStock === 0
    );

    const allFilteredProducts = [...limitedStockProduct, ...emptyProducts];
    const totalProducts = allFilteredProducts.length;
    const paginatedProducts = allFilteredProducts.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { productId, quantity } = req.body;
    const product = await productModel.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    product.totalStock = quantity;
    await product.save();
    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};
