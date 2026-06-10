import express from "express";
import Attribute from "../models/Attribute.js";

const router = express.Router();

// Get all attributes (colors and shapes)
router.get("/", async (req, res) => {
  try {
    let colorsAttr = await Attribute.findOne({ name: "colors" });
    if (!colorsAttr) {
      colorsAttr = await Attribute.create({
        name: "colors",
        values: ["Azul", "Beige", "Black", "Blue", "Bronze", "Brown", "Dark Grey", "Grey", "Metallic Brown", "White"]
      });
    }

    let shapesAttr = await Attribute.findOne({ name: "shapes" });
    if (!shapesAttr) {
      shapesAttr = await Attribute.create({
        name: "shapes",
        values: ["Chevron", "Herringbone", "Hexagon", "Pickets", "Planks", "Rectangle", "Rhombus", "Square", "Trapezium", "Triangle", "Woven Square"]
      });
    }

    let mosaiciAttr = await Attribute.findOne({ name: "mosaici" });
    if (!mosaiciAttr) {
      mosaiciAttr = await Attribute.create({
        name: "mosaici",
        values: [
          "20.5x20.8 cm",
          "21.1x21.1 cm",
          "25.8x29.8 cm",
          "26.5x34.5 cm",
          "28.3x30.5 cm",
          "29.4x29.8 cm",
          "29.9x34.6 cm",
          "29x30",
          "30.1x29.8 cm",
          "30.5x23.5 cm",
          "30x26 cm",
          "30x30",
          "30x30 cm",
          "31.1x37.7",
          "31x25.5 cm",
          "34.6x30 cm",
          "38x38 cm",
          "45.8x16.2 cm",
          "Alpi Bronze Topaz"
        ]
      });
    }

    return res.json({
      colors: colorsAttr.values,
      shapes: shapesAttr.values,
      mosaici: mosaiciAttr.values
    });
  } catch (err) {
    console.error("Error fetching attributes:", err);
    return res.status(500).json({ message: "Server error fetching attributes" });
  }
});

// Add a value to an attribute list
router.post("/:name/add", async (req, res) => {
  try {
    const { name } = req.params;
    const { value } = req.body;

    if (!value || typeof value !== "string") {
      return res.status(400).json({ message: "Value is required and must be a string" });
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return res.status(400).json({ message: "Value cannot be empty" });
    }

    // Capitalize first letter for formatting consistency
    const formattedValue = trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);

    const attr = await Attribute.findOneAndUpdate(
      { name },
      { $addToSet: { values: formattedValue } },
      { new: true, upsert: true }
    );

    return res.json({ name, values: attr.values });
  } catch (err) {
    console.error(`Error adding attribute value for ${req.params.name}:`, err);
    return res.status(500).json({ message: "Server error adding attribute value" });
  }
});

// Remove a value from an attribute list
router.post("/:name/delete", async (req, res) => {
  try {
    const { name } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ message: "Value is required for deletion" });
    }

    const attr = await Attribute.findOneAndUpdate(
      { name },
      { $pull: { values: value } },
      { new: true }
    );

    return res.json({ name, values: attr ? attr.values : [] });
  } catch (err) {
    console.error(`Error deleting attribute value for ${req.params.name}:`, err);
    return res.status(500).json({ message: "Server error deleting attribute value" });
  }
});

export default router;
