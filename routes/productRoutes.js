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
router.post("/", upload.array("images", 30), createProduct);
router.put("/:id", upload.fields([
  { name: "images", maxCount: 30 },
  { name: "colorImages", maxCount: 60 }
]), updateProduct);
router.delete("/:id", deleteProduct);

export default router;