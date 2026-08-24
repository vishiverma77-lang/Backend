import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import dns from "node:dns"; // Import DNS module
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import attributeRoutes from "./routes/attributeRoutes.js";
import slideRoutes from "./routes/slideRoutes.js";

// Force Node.js to use public DNS for SRV record resolution
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:5174", 
  "http://localhost:5175", 
  "http://localhost:5176", 
  "https://shopceragresluxe.com", 
  "https://www.shopceragresluxe.com"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.includes("shopceragresluxe.com") ||
      origin.includes("localhost")
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(express.json());

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/slides", slideRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Keep-alive health check route for Render pings
app.get("/api/ping", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is active", timestamp: new Date().toISOString() });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err?.message || err?.stack || err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: "File upload error: " + err.message });
  }
  // Cloudinary / multer-storage-cloudinary errors
  if (err?.http_code || err?.message?.includes('not allowed') || err?.message?.includes('format')) {
    return res.status(400).json({ message: "Upload Error: " + err.message });
  }
  res.status(err?.status || 500).json({ message: err?.message || "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});