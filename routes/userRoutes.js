import express from "express";
import { register, login, checkAuth } from "../controllers/userAuthController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/check", authenticateUser, checkAuth);

export default router;
