import express from "express";
import { createOrder, getOrders, updateOrderStatus, deleteOrder } from "../controllers/orderController.js";

const router = express.Router();

// All order routes - open for admin dashboard use
router.post("/", createOrder);
router.get("/", getOrders);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
