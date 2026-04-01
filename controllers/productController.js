import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    // Parse arrays that were stringified via FormData
    const arrayFields = ["colors", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes"];
    arrayFields.forEach(key => {
        if (typeof productData[key] === 'string') {
            try { productData[key] = JSON.parse(productData[key]); } catch (e) {}
        }
    });

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.path);
    } else {
      productData.images = [];
    }

    const product = new Product(productData);
    const saved = await product.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const filter = {};
    const { effect, format, color, style, material, size, look, finish, search } = req.query;

    if (effect) filter.effects = effect;
    if (format) filter.formats = format;
    if (color) filter.colors = color;
    if (style) filter.styles = style;
    if (material) filter.materials = material;
    if (size) filter.sizes = size;
    if (look) filter.looks = look;
    if (finish) filter.finishes = finish;

    // Unified search for all tags, uses, category, description and name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tileUses: searchRegex },
        { effects: searchRegex },
        { formats: searchRegex },
        { colors: searchRegex },
        { styles: searchRegex },
        { materials: searchRegex },
        { sizes: searchRegex },
        { looks: searchRegex },
        { finishes: searchRegex }
      ];
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = { ...req.body };
    
    // Parse arrays that were stringified via FormData
    const arrayFields = ["colors", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes"];
    arrayFields.forEach(key => {
        if (typeof productData[key] === 'string') {
            try { productData[key] = JSON.parse(productData[key]); } catch (e) {}
        }
    });

    if (req.files && req.files.length > 0) {
      // If new images are uploaded, determine the final array
      // Existing images might be passed in `existingImages`
      let finalImages = [];
      if (typeof productData.existingImages === 'string') {
          try { finalImages = JSON.parse(productData.existingImages); } catch (e) {}
      } else if (Array.isArray(productData.existingImages)) {
          finalImages = productData.existingImages;
      }
      
      const newImages = req.files.map(file => file.path);
      productData.images = [...finalImages, ...newImages];
    } else {
      // Only existing images preserved
      if (typeof productData.existingImages === 'string') {
          try { productData.images = JSON.parse(productData.existingImages); } catch (e) { productData.images = []; }
      } else if (Array.isArray(productData.existingImages)) {
          productData.images = productData.existingImages;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};