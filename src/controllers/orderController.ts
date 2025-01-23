import { Request, Response } from "express";
import paypal from "../utils/paypal";
import orderModel from "../models/orderModel";
import cartModel from "../models/cartModel";
import { getCurrentUserId } from "../utils/currentUserId";
import userModel from "../models/userModel";
import productModel from "../models/productModel";
import nodemailer from "nodemailer";
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
    if (orderStatus === "Completed") {
      for (const item of order.cartItems) {
        if (item.quantity !== undefined && item.quantity !== null) {
          await productModel.findByIdAndUpdate(item.productId, {
            $inc: { totalStock: -item.quantity },
          });
        }
      }
    } else if (orderStatus === "Confirmed" || orderStatus === "In Process") {
      for (const item of order.cartItems) {
        if (item.quantity !== undefined && item.quantity !== null) {
          await productModel.findByIdAndUpdate(item.productId, {
            $inc: { totalStock: +item.quantity },
          });
        }
      }
    }
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
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email provider (e.g., 'gmail', 'yahoo', 'hotmail', etc.)
      auth: {
        user: "adityagupta1291@gmail.com", // Your email address
        pass: process.env.NODEMAILER_ACCOUNT_PASS, // Your email password or app password
      },
    });
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 10px 0;
          border-bottom: 2px solid #f0f0f0;
        }
        .header h1 {
          margin: 0;
          color: #444;
        }
        .order-details {
          margin: 20px 0;
        }
        .order-details img {
          width: 100px;
          height: auto;
          border-radius: 4px;
        }
        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .item-info {
          flex: 1;
          margin-left: 10px;
        }
        .item-info h4 {
          margin: 0;
          font-size: 16px;
        }
        .item-info p {
          margin: 5px 0 0;
          font-size: 14px;
          color: #777;
        }
        .total {
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
        <h1>
          <a href="https://storex-frontend.vercel.app/">Ajit Agencies</a>
        </h1>
        <h1>Order Confirmation</h1>
        </div>
    
        <p>Thank you for your order! Here are the details:</p>
    
        <div class="order-details">
          ${cartItems
            .map(
              (item: any) => `
          <div class="item">
            <img src="${item.image}" alt="${item.title}">
            <div class="item-info">
              <h4>${item.title}</h4>
              <p>Price: ₹${item.salePrice}</p>
              <p>Quantity: ${item.quantity}</p>
            </div>
          </div>
          `
            )
            .join("")}
        </div>
    
        <div class="total">
          Total Amount: ₹${totalAmount}
        </div>
    
        <p><strong>Payment Status:</strong> ${paymentStatus}</p>
        <p><strong>Order Status:</strong> ${orderStatus}</p>
    
        <div class="footer">
          <p>To check progress of your order, please check our website.</p>
          <p>&copy; 2025 Ajit Agencies</p>
        </div>
      </div>
    </body>
    </html>`;
    const mailOptions = {
      from: process.env.NODEMAILER_ACCOUNT_EMAIL,
      to: `${user.email}, adityagupta1291@gmail.com`,
      subject: "Order Placed Successfully",
      html: htmlTemplate,
    };
    await transporter.sendMail(mailOptions);
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
    const userAllOrder = await orderModel.find({ userId });
    const orders = userAllOrder.map((order) => ({
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
