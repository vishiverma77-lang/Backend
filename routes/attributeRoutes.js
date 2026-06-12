import express from "express";
import Attribute from "../models/Attribute.js";

const router = express.Router();

// Get all attributes
router.get("/", async (req, res) => {
  try {
    const attributesList = [
      { name: "colors", values: ["Azul", "Beige", "Black", "Blue", "Bronze", "Brown", "Dark Grey", "Grey", "Metallic Brown", "White"] },
      { name: "shapes", values: ["Chevron", "Herringbone", "Hexagon", "Pickets", "Planks", "Rectangle", "Rhombus", "Square", "Trapezium", "Triangle", "Woven Square"] },
      { name: "mosaici", values: [
        "20.5x20.8 cm", "21.1x21.1 cm", "25.8x29.8 cm", "26.5x34.5 cm", "28.3x30.5 cm", "29.4x29.8 cm", "29.9x34.6 cm",
        "29x30", "30.1x29.8 cm", "30.5x23.5 cm", "30x26 cm", "30x30", "30x30 cm", "31.1x37.7", "31x25.5 cm",
        "34.6x30 cm", "38x38 cm", "45.8x16.2 cm", "Alpi Bronze Topaz"
      ] },
      { name: "effects", values: ["Concrete", "Stone", "Wood", "Marble", "Metal", "Contemporary", "Precious Metal", "Artisan", "Carpet"] },
      { name: "formats", values: ["Small", "Medium", "Large", "Slabs", "Planks", "Stripes", "Chevron", "Hexagon"] },
      { name: "tileUses", values: ["Bathroom Wall", "Outdoor Wall", "Kitchen Wall", "Wall Tile", "Backsplash", "Shower Wall", "Kitchen Floor", "Floor Tile", "Bathroom Floor", "Commercial Floor", "Outdoor Floor", "Shower Floor", "Pool Tile"] },
      { name: "styles", values: ["Traditional", "Contemporary", "Rustic", "Modern", "Transitional", "Industrial", "Classic", "Mediterranean", "Mid Century", "Farmhouse", "Craftsman", "Beach", "Cottage", "Tropical", "Art Deco", "Whimsical", "Spanish Revival"] },
      { name: "materials", values: ["Ceramic & Porcelain", "Porcelain", "Stone", "Marble", "Glass", "Ceramic", "Terrazzo", "Pebble Tile", "Terracotta", "Lava Stone", "Clay Brick", "Cement"] },
      { name: "looks", values: ["Stone Look", "Decorative Look", "Marble Look", "Concrete Look", "Solid Color", "Wood Look", "3D", "Subway Tile"] },
      { name: "finishes", values: ["Matte", "Polished", "Textured", "Satin", "Crackled"] }
    ];

    const result = {};
    for (const attr of attributesList) {
      let doc = await Attribute.findOne({ name: attr.name });
      if (!doc) {
        doc = await Attribute.create(attr);
      } else {
        // Repair/Merge logic: ensure all default values exist in the database document
        let modified = false;
        attr.values.forEach(val => {
          if (!doc.values.includes(val)) {
            doc.values.push(val);
            modified = true;
          }
        });
        if (modified) {
          await doc.save();
        }
      }
      result[attr.name] = doc.values;
    }

    return res.json(result);
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

    const defaults = {
      colors: ["Azul", "Beige", "Black", "Blue", "Bronze", "Brown", "Dark Grey", "Grey", "Metallic Brown", "White"],
      shapes: ["Chevron", "Herringbone", "Hexagon", "Pickets", "Planks", "Rectangle", "Rhombus", "Square", "Trapezium", "Triangle", "Woven Square"],
      mosaici: ["20.5x20.8 cm", "21.1x21.1 cm", "25.8x29.8 cm", "26.5x34.5 cm", "28.3x30.5 cm", "29.4x29.8 cm", "29.9x34.6 cm", "29x30", "30.1x29.8 cm", "30.5x23.5 cm", "30x26 cm", "30x30", "30x30 cm", "31.1x37.7", "31x25.5 cm", "34.6x30 cm", "38x38 cm", "45.8x16.2 cm", "Alpi Bronze Topaz"],
      effects: ["Concrete", "Stone", "Wood", "Marble", "Metal", "Contemporary", "Precious Metal", "Artisan", "Carpet"],
      formats: ["Small", "Medium", "Large", "Slabs", "Planks", "Stripes", "Chevron", "Hexagon"],
      tileUses: ["Bathroom Wall", "Outdoor Wall", "Kitchen Wall", "Wall Tile", "Backsplash", "Shower Wall", "Kitchen Floor", "Floor Tile", "Bathroom Floor", "Commercial Floor", "Outdoor Floor", "Shower Floor", "Pool Tile"],
      styles: ["Traditional", "Contemporary", "Rustic", "Modern", "Transitional", "Industrial", "Classic", "Mediterranean", "Mid Century", "Farmhouse", "Craftsman", "Beach", "Cottage", "Tropical", "Art Deco", "Whimsical", "Spanish Revival"],
      materials: ["Ceramic & Porcelain", "Porcelain", "Stone", "Marble", "Glass", "Ceramic", "Terrazzo", "Pebble Tile", "Terracotta", "Lava Stone", "Clay Brick", "Cement"],
      looks: ["Stone Look", "Decorative Look", "Marble Look", "Concrete Look", "Solid Color", "Wood Look", "3D", "Subway Tile"],
      finishes: ["Matte", "Polished", "Textured", "Satin", "Crackled"]
    };

    let attr = await Attribute.findOne({ name });
    if (!attr) {
      // If it doesn't exist, create it with the default values + the new value
      const initialValues = Array.from(new Set([...(defaults[name] || []), formattedValue]));
      attr = await Attribute.create({
        name,
        values: initialValues
      });
    } else {
      // If it exists, ensure all default values are present (repair/merge)
      let modified = false;
      const defaultList = defaults[name] || [];
      defaultList.forEach(val => {
        if (!attr.values.includes(val)) {
          attr.values.push(val);
          modified = true;
        }
      });
      // Push the new value if not already present
      if (!attr.values.includes(formattedValue)) {
        attr.values.push(formattedValue);
        modified = true;
      }
      if (modified) {
        await attr.save();
      }
    }

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

    const defaults = {
      colors: ["Azul", "Beige", "Black", "Blue", "Bronze", "Brown", "Dark Grey", "Grey", "Metallic Brown", "White"],
      shapes: ["Chevron", "Herringbone", "Hexagon", "Pickets", "Planks", "Rectangle", "Rhombus", "Square", "Trapezium", "Triangle", "Woven Square"],
      mosaici: ["20.5x20.8 cm", "21.1x21.1 cm", "25.8x29.8 cm", "26.5x34.5 cm", "28.3x30.5 cm", "29.4x29.8 cm", "29.9x34.6 cm", "29x30", "30.1x29.8 cm", "30.5x23.5 cm", "30x26 cm", "30x30", "30x30 cm", "31.1x37.7", "31x25.5 cm", "34.6x30 cm", "38x38 cm", "45.8x16.2 cm", "Alpi Bronze Topaz"],
      effects: ["Concrete", "Stone", "Wood", "Marble", "Metal", "Contemporary", "Precious Metal", "Artisan", "Carpet"],
      formats: ["Small", "Medium", "Large", "Slabs", "Planks", "Stripes", "Chevron", "Hexagon"],
      tileUses: ["Bathroom Wall", "Outdoor Wall", "Kitchen Wall", "Wall Tile", "Backsplash", "Shower Wall", "Kitchen Floor", "Floor Tile", "Bathroom Floor", "Commercial Floor", "Outdoor Floor", "Shower Floor", "Pool Tile"],
      styles: ["Traditional", "Contemporary", "Rustic", "Modern", "Transitional", "Industrial", "Classic", "Mediterranean", "Mid Century", "Farmhouse", "Craftsman", "Beach", "Cottage", "Tropical", "Art Deco", "Whimsical", "Spanish Revival"],
      materials: ["Ceramic & Porcelain", "Porcelain", "Stone", "Marble", "Glass", "Ceramic", "Terrazzo", "Pebble Tile", "Terracotta", "Lava Stone", "Clay Brick", "Cement"],
      looks: ["Stone Look", "Decorative Look", "Marble Look", "Concrete Look", "Solid Color", "Wood Look", "3D", "Subway Tile"],
      finishes: ["Matte", "Polished", "Textured", "Satin", "Crackled"]
    };

    const defaultList = defaults[name] || [];
    if (defaultList.includes(value)) {
      return res.status(400).json({ message: "Cannot delete default attribute values" });
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
