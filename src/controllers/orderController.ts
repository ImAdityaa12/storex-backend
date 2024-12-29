import { Request, Response } from "express";
import paypal from "../utils/paypal";
import orderModel from "../models/orderModel";
import cartModel from "../models/cartModel";
import { getCurrentUserId } from "../utils/currentUserId";
import userModel from "../models/userModel";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      cartItems,
      address,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId,
      payerId,
      cartId,
    } = req.body;

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
      transactions: [
        {
          item_list: {
            items: cartItems.map((item: any) => ({
              name: item.title,
              sku: item._id,
              price: item.price,
              currency: "USD",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "USD",
            total: totalAmount.toFixed(2),
          },
          description: "Order description",
        },
      ],
    };

    paypal.payment.create(create_payment_json, (error, paymentInfo) => {
      if (error) {
        console.log(error);
        res.status(500).json("An error occurred");
      } else {
        const newOrder = new orderModel({
          userId,
          cartItems,
          address,
          orderStatus,
          paymentMethod,
          paymentStatus,
          totalAmount,
          orderDate,
          orderUpdateDate,
          paymentId,
          payerId,
          cartId,
        });
        newOrder.save();
        const approvalUrl = paymentInfo.links?.find(
          (link: any) => link.rel === "approval_url"
        );

        if (approvalUrl) {
          res.redirect(approvalUrl.href);
        } else {
          res.status(500).json("An error occurred");
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
  }
};
export const capturePayment = async (req: Request, res: Response) => {
  // try {
  //   const { paymentId, payerId, orderId } = req.body;
  //   const order = await orderModel.findById(orderId);
  //   if (!order) {
  //     res.status(404).json("Order not found");
  //     return;
  //   }
  //   order.paymentStatus = "paid";
  //   order.orderStatus = "confirmed";
  //   order.paymentId = paymentId;
  //   order.payerId = payerId;
  //   await order.save();
  //   const getCartId = order.cartId;
  //   await cartModel.findByIdAndDelete(getCartId);
  //   res.status(200).json("Payment captured successfully");
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json("An error occurred");
  // }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (user?.role !== "admin") {
      res.status(404).json("Unauthorized");
      return;
    }
    const { orderStatus, paymentStatus } = req.body;
    const order = await orderModel.findById(id);
    if (!order) {
      res.status(404).json("Order not found");
      return;
    }
    order.orderStatus = orderStatus;
    order.paymentStatus = paymentStatus;
    await order.save();
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
    return;
  }
};

export const addOrderController = async (req: Request, res: Response) => {
  try {
    const {
      cartItems,
      address,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      cartId,
    } = req.body;
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const user = await userModel.findById(userId);
    if (!user) {
      res.status(404).json("User not found");
      return;
    }
    if (paymentMethod === "credit") {
      if (user?.credit < totalAmount) {
        res.status(400).json({
          message: "Insufficient credit for this order",
          success: false,
        });
        return;
      } else {
        await userModel.findByIdAndUpdate(userId, {
          $inc: { credit: -totalAmount },
        });
      }
    }
    const currentCredit = user.credit - totalAmount;
    const newOrder = new orderModel({
      userId,
      cartItems,
      address,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      cartId,
    });
    await newOrder.save();
    const cart = await cartModel.findById(cartId);
    if (cart) {
      await cartModel.findByIdAndDelete(cartId);
    }
    res.status(200).json({
      message: "Order added successfully",
      order: newOrder,
      credit: currentCredit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
    return;
  }
};

export const getUserOrder = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    const userId = getCurrentUserId(token);
    const allUserOrders = await orderModel.find({ userId });
    const orders = allUserOrders.map((order) => ({
      _id: order._id,
      items: order.cartItems,
      total: order.totalAmount,
      status: order.orderStatus,
      date: order.orderDate,
      address: order.address,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    }));
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json("An error occurred");
    return;
  }
};
