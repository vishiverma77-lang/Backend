import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Register Logic
export const register = async (req, res) => {
    try {
        const { name, lastName, zipCode, state, profession, jobTitle, website, email, phone, address, accountType, password } = req.body;

        // Check if user already exists
        const query = [{ email }];
        if (phone) query.push({ phone });

        const existingUser = await User.findOne({ $or: query });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or phone already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name: name || "",
            lastName: lastName || "",
            zipCode: zipCode || "",
            state: state || "",
            profession: profession || "",
            jobTitle: jobTitle || "",
            website: website || "",
            email,
            phone: phone || "",
            address: address || "",
            accountType: accountType ? (accountType.charAt(0).toUpperCase() + accountType.slice(1)) : "Customer",
            password: hashedPassword
        });

        await newUser.save();

        // Generate Token
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET_USER || 'rairoshan_user_secret_key_2024',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                accountType: newUser.accountType,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
};

// Login Logic
export const login = async (req, res) => {
    try {
        const { email, password, name, phone, address, accountType } = req.body;

        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password." });
        }

        // Update login info and optional profile updates
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        user.lastLogin = new Date();
        user.lastLoginIP = ip;
        user.lastLoginLocation = "Localhost";
        
        if (name && !user.name) user.name = name;
        if (phone && !user.phone) user.phone = phone;
        if (address && !user.address) user.address = address;
        if (accountType) user.accountType = accountType.charAt(0).toUpperCase() + accountType.slice(1);

        await user.save();

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET_USER || 'rairoshan_user_secret_key_2024',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                accountType: user.accountType,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};

// Check Auth Logic
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Check Auth Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get All Users (for Admin Customer Details)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ message: "Server error fetching users." });
    }
};

// Delete User (for Admin)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: "Server error deleting user." });
    }
};
