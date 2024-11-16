import express, { Express } from "express";
import dotenv from "dotenv";
import usersRouter from "./routes/userRouter";
import adminRouter from "./routes/adminRoute";
import cartRouter from "./routes/cartRouter";
import productsRoute from "./routes/productsRoute";
import addressRoute from "./routes/addressRoute";
import orderRouter from "./routes/orderRoutes";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import { upload } from "./utils/cloudinary";
import { handleImageUploadController } from "./controllers/image/uploadImageController";
dotenv.config();
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING as string)
  .then(() => console.log("Connected to database!"));
const app: Express = express();
const port = process.env.PORT || 7000;
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: [
    //   "Content-Type",
    //   "Authorization",
    //   "Cache-Control",
    //   "Expires",
    //   "Pragma",
    // ],
  })
);
app.get("/", async (req, res) => {
  res.send("Express on Vercel");
});
app.use("/users", usersRouter);
app.use("/admin/products", adminRouter);
app.use("/products/shop", productsRoute);
app.use("/user/cart", cartRouter);
app.use("/users/address", addressRoute);
app.use("/user/order", orderRouter);
app.use("/upload/image", upload.single("image"), handleImageUploadController);
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
