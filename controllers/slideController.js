import Slide from "../models/Slide.js";

// Fetch all slides
export const getSlides = async (req, res) => {
  try {
    const slides = await Slide.find().sort({ order: 1, createdAt: -1 }).lean();
    res.status(200).json(slides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch slides: " + error.message });
  }
};

// Create a new slide
export const createSlide = async (req, res) => {
  try {
    const { title, subtitle, btnText, link, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Slide image is required" });
    }

    const newSlide = new Slide({
      image: req.file.path, // Cloudinary URL path
      title: title || "",
      subtitle: subtitle || "",
      btnText: btnText || "",
      link: link || "",
      order: order ? Number(order) : 0
    });

    await newSlide.save();
    res.status(201).json(newSlide);
  } catch (error) {
    res.status(500).json({ message: "Failed to create slide: " + error.message });
  }
};

// Delete an existing slide
export const deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSlide = await Slide.findByIdAndDelete(id);
    
    if (!deletedSlide) {
      return res.status(404).json({ message: "Slide not found" });
    }

    res.status(200).json({ message: "Slide deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete slide: " + error.message });
  }
};
