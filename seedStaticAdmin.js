import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/Admin.js";

dotenv.config();

const seedStaticAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Clean up any existing admins with the provided email or phone
        await Admin.deleteMany({
            $or: [
                { email: "vishiverma77@gmail.com" },
                { email: "rairoshan69883@gmail.com" },
                { phone: "7740037264" }
            ]
        });

        // Create the new static admin
        const admin = new Admin({
            email: "vishiverma77@gmail.com",
            password: "rairoshan69883@gmail.com",
            phone: "7740037264",
            role: "admin"
        });

        await admin.save();
        console.log("Admin vishiverma77@gmail.com initialized with static password: rairoshan69883@gmail.com");

    } catch (error) {
        console.error("Seeding Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedStaticAdmin();
