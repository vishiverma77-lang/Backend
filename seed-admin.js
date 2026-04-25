import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const existing = await Admin.findOne({ email: "vishiverma77@gmail.com" });
        if (existing) {
            console.log("Admin already exists.");
        } else {
            const newAdmin = new Admin({
                email: "vishiverma77@gmail.com",
                password: "your_password_here", // I'll use a placeholder and tell the user to check .env or set it
                phone: "0000000000",
                role: "admin"
            });
            
            // If I can find a likely password from .env, I'll use it as a guess but tell the user
            if (process.env.EMAIL_PASS) {
                // newAdmin.password = process.env.EMAIL_PASS; // This might be wrong if it's an app pass
            }

            await newAdmin.save();
            console.log("Admin created successfully for vishiverma77@gmail.com");
        }
        
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin();
