import mongoose from "mongoose";
import dotenv from "dotenv";
import Attribute from "./models/Attribute.js";

dotenv.config();

const staticValues = {
  colors: ["Azul", "Beige", "Black", "Blue", "Bronze", "Brown", "Dark Grey", "Grey", "Metallic Brown", "White"],
  shapes: ["Chevron", "Herringbone", "Hexagon", "Pickets", "Planks", "Rectangle", "Rhombus", "Square", "Trapezium", "Triangle", "Woven Square"],
  mosaici: [
    "20.5x20.8 cm", "21.1x21.1 cm", "25.8x29.8 cm", "26.5x34.5 cm", "28.3x30.5 cm", "29.4x29.8 cm", "29.9x34.6 cm",
    "29x30", "30.1x29.8 cm", "30.5x23.5 cm", "30x26 cm", "30x30", "30x30 cm", "31.1x37.7", "31x25.5 cm",
    "34.6x30 cm", "38x38 cm", "45.8x16.2 cm", "Alpi Bronze Topaz"
  ],
  formats: ["Small", "Medium", "Large", "Slabs", "Planks", "Stripes", "Chevron", "Hexagon"],
  finishes: ["Matte", "Polished", "Textured", "Satin", "Crackled"]
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB database.");

    for (const key of Object.keys(staticValues)) {
      const doc = await Attribute.findOne({ name: key });
      if (doc) {
        const originalCount = doc.values.length;
        // Filter out static values
        doc.values = doc.values.filter(val => !staticValues[key].includes(val));
        await doc.save();
        console.log(`Cleaned up attribute "${key}": reduced from ${originalCount} to ${doc.values.length} values.`);
      } else {
        console.log(`Attribute "${key}" not found in database.`);
      }
    }

    console.log("Database cleanup completed successfully!");
  } catch (err) {
    console.error("Error during database cleanup:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
