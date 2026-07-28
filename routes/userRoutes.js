import express from "express";
import { register, login, checkAuth, getAllUsers, deleteUser } from "../controllers/userAuthController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllUsers);
router.delete("/:id", deleteUser);
router.post("/register", register);
router.post("/login", login);
router.get("/check", authenticateUser, checkAuth);

export default router;
