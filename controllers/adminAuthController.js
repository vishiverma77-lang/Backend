import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

// 1. Initial Login - Verify Email & Password
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Restriction: Only vishiverma77@gmail.com is allowed as Admin
        if (email !== "vishiverma77@gmail.com") {
            return res.status(403).json({ message: "You are not accessible." });
        }

        if (password !== "vishiverma77@") {
            return res.status(401).json({ message: "Invalid password." });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Admin account not found." });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET_ADMIN || 'rairoshan_admin_secret_key_2024',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
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


// 2. Verify OTP - Disabled
export const verifyOtp = async (req, res) => {
    res.status(400).json({ message: "OTP verification is disabled. Please use password login." });
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

