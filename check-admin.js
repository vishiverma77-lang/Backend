import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const admin = await Admin.findOne({ email: "vishiverma77@gmail.com" });
        if (admin) {
            console.log("Admin found:", {
                email: admin.email,
                role: admin.role,
                password: admin.password // Viewing for debug purposes
            });
        } else {
            console.log("Admin NOT found for vishiverma77@gmail.com");
            
            // To help the user, let's list all admins
            const allAdmins = await Admin.find({});
            console.log("All Admins in DB:", allAdmins.map(a => a.email));
        }
        
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

checkAdmin();
