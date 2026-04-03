import express from "express";
import { login, checkAuth } from "../controllers/adminAuthController.js";
import { authenticateAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Static login route
router.post("/login", login);

// Protected route for checking session validity on frontend
router.get("/check", authenticateAdmin, checkAuth);

export default router;
