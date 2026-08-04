import express from "express";
import { createOrder, getOrders, updateOrderStatus, deleteOrder, getMyOrders, calculateDelivery, createRazorpayOrder, verifyRazorpayPayment } from "../controllers/orderController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// User Route (Needs to be before /:id routes to avoid matching "my-orders" as an ID)
router.get("/my-orders", authenticateUser, getMyOrders);

// All other order routes - no auth required (admin panel is open)
router.post("/calculate-delivery", calculateDelivery);
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-razorpay-payment", verifyRazorpayPayment);
router.post("/", createOrder);
router.get("/", getOrders);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
