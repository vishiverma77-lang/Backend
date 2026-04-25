import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 1. Initial Login - Verify Email & Send OTP
export const login = async (req, res) => {
    try {
        const { email } = req.body;

        // Restriction: Only vishiverma77@gmail.com is allowed as Admin
        if (email !== "vishiverma77@gmail.com") {
            return res.status(403).json({ message: "You are not accessible." });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            // Even if the record doesn't exist, for specific restricted emails, we might want to fail gracefully
            // but here we know the record exists due to seeding.
            return res.status(401).json({ message: "Admin account not found." });
        }


        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Save OTP to Admin record
        admin.otp = otp;
        admin.otpExpires = otpExpires;
        await admin.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: "vishiverma77@gmail.com",
            subject: "Admin Access Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Verification Code</h2>
                    <p>Hello Admin,</p>
                    <p>Your 6-digit verification code to access the Admin Panel is:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        // Send OTP via Email
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Verification code sent to your email." });





    } catch (error) {
        console.error("DEBUG - Login Error Detail:", {
            message: error.message,
            stack: error.stack,
            code: error.code, // Useful for Nodemailer errors
            command: error.command
        });
        res.status(500).json({ 
            message: "Server error during login.", 
            error: error.message // Temporarily expose error for user to see
        });
    }
};


// 2. Verify OTP & Issue Token
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin || admin.otp !== otp || new Date() > admin.otpExpires) {
            return res.status(401).json({ message: "Invalid or expired verification code." });
        }

        // Clear OTP fields after successful verification
        admin.otp = null;
        admin.otpExpires = null;
        await admin.save();

        // Generate JWT Token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET_ADMIN || 'rairoshan_admin_secret_key_2024',
            { expiresIn: '1d' }
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
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: "Server error during verification." });
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

