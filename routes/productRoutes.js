import express from "express";
import { upload } from "../config/cloudinary.js";
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "../controllers/productController.js";

const router = express.Router();

// All product routes - open for admin dashboard use
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", upload.fields([
  { name: "images", maxCount: 30 },
  { name: "colorImages", maxCount: 60 },
  { name: "video", maxCount: 1 },
  { name: "colorVideos", maxCount: 20 },
  { name: "images360", maxCount: 36 }
]), createProduct);
router.put("/:id", upload.fields([
  { name: "images", maxCount: 30 },
  { name: "colorImages", maxCount: 60 },
  { name: "video", maxCount: 1 },
  { name: "colorVideos", maxCount: 20 },
  { name: "images360", maxCount: 36 }
]), updateProduct);
router.delete("/:id", deleteProduct);

export default router;