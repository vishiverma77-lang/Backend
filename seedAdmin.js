import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Check if admin already exists
        const existing = await Admin.findOne({ email: "rairoshan69883@gmail.com" });
        if (existing) {
            console.log("Admin already exists!");
        } else {
            const newAdmin = new Admin({
                email: "rairoshan69883@gmail.com",
                phone: "7740037264",
                role: "admin"
            });
            await newAdmin.save();
            console.log("Initial Admin seeded successfully!");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedAdmin();
