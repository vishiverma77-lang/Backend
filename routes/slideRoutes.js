import express from "express";
import { upload } from "../config/cloudinary.js";
import { getSlides, createSlide, deleteSlide } from "../controllers/slideController.js";

const router = express.Router();

router.get("/", getSlides);
router.post("/", upload.single("image"), createSlide);
router.delete("/:id", deleteSlide);

export default router;
