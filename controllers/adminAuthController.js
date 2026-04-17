import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

// Simple static login by comparing email and password
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find Admin by email
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: "Invalid Email or Password." });
        }

        // 2. Compare Password (Plain text as requested for "static")
        if (admin.password !== password) {
            return res.status(401).json({ message: "Invalid Email or Password." });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET_ADMIN || 'rairoshan_admin_secret_key_2024',
            { expiresIn: '1d' } // Session valid for 1 day
        );

        res.json({
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select("-password");
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: "Auth check failed" });
    }
};
