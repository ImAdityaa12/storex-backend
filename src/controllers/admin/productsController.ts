import { Request, Response } from "express";
import { imageUploadUtil } from "../../utils/cloudinary";
import productModel from "../../models/productModel";
import orderModel from "../../models/orderModel";
import userModel from "../../models/userModel";
import { getCurrentUserId } from "../../utils/currentUserId";
import modelNumber from "../../models/modelNumber";
import categoryModel from "../../models/categoryModel";
import brandModel from "../../models/brandModel";
import { model, models } from "mongoose";
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
      salePrice,
      totalStock,
    } = req.body;
    const product = await productModel.create({
      image,
      title,
      description,
      price,
      brand,
      category,
      salePrice,
      totalStock,
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
    const orders = await orderModel.find();
    res.json({ orders });
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
    const users = await userModel.find();
    const allUsers = users.filter((user) => user.id !== userId);
    res.json({ users: allUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching products" });
  }
};

export const addModelController = async (req: Request, res: Response) => {
  try {
    const { models } = req.body;
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);

    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!Array.isArray(models)) {
      res.status(400).json({ message: "Models must be provided as an array" });
      return;
    }

    const results = {
      success: [] as string[],
      duplicates: [] as string[],
      errors: [] as string[],
    };

    for (const model of models) {
      try {
        const existingModel = await modelNumber.findOne({ model });

        if (existingModel) {
          results.duplicates.push(model);
          continue;
        }

        const createdModel = await modelNumber.create({ model });

        if (createdModel) {
          results.success.push(model);
        }
      } catch (error) {
        results.errors.push(model);
        console.error(`Error processing model ${model}:`, error);
      }
    }

    // Prepare response message
    const response = {
      message: "Models processing completed",
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

export const addCategoryController = async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);

    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!Array.isArray(categories)) {
      res
        .status(400)
        .json({ message: "Categories must be provided as an array" });
      return;
    }

    const results = {
      success: [] as string[],
      duplicates: [] as string[],
      errors: [] as string[],
    };

    for (const category of categories) {
      try {
        const existingModel = await categoryModel.findOne({ category });

        if (existingModel) {
          results.duplicates.push(category);
          continue;
        }

        const createdCategory = await categoryModel.create({ category });

        if (createdCategory) {
          results.success.push(category);
        }
      } catch (error) {
        results.errors.push(category);
        console.error(`Error processing Category ${category}:`, error);
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
      console.log(brand);
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
