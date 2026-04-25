import express from "express";
import { login, verifyOtp, checkAuth } from "../controllers/adminAuthController.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Step 1: Initial login (Email/Pass) -> Sends OTP
router.post("/login", login);

// Step 2: Verify OTP -> Issues JWT
router.post("/verify-otp", verifyOtp);

// Protected route for checking session validity on frontend
router.get("/check", authenticateAdmin, checkAuth);

export default router;

