import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  console.log("Create Product Triggered...");
  console.log("Body Items:", Object.keys(req.body));
  console.log("Files Count:", req.files?.length || 0);

  try {
    const productData = { ...req.body };
    
    // Parse arrays that were stringified via FormData
    const arrayFields = ["colors", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes", "tileUses"];
    arrayFields.forEach(key => {
        if (typeof productData[key] === 'string') {
            try { 
                productData[key] = JSON.parse(productData[key]); 
            } catch (e) {
                console.warn(`Failed to parse field: ${key}`, e.message);
            }
        }
    });

    const { images: mainImageFiles = [], video: videoFiles = [], colorVideos: colorVideoFiles = [], images360: images360Files = [] } = req.files || {};
      
    if (videoFiles && videoFiles.length > 0) {
      productData.video = videoFiles[0].path;
    }

    productData.images360 = images360Files.map(f => f.path);

    const colorVideoPaths = colorVideoFiles.map(f => f.path);

    if (mainImageFiles && mainImageFiles.length > 0) {
      const allPaths = mainImageFiles.map(file => file.path);
      productData.images = allPaths; // Initially assign all, will filter out variant images below

      // Map images and videos to colorOptions if they exist
      if (typeof productData.colorOptions === 'string') {
          try {
              const parsedOptions = JSON.parse(productData.colorOptions);
              const usedIndices = new Set();
              productData.colorOptions = parsedOptions.map(opt => ({
                  color: opt.color,
                  name: opt.name,
                  price: Number(opt.price),
                  size: opt.size,
                  sizes: opt.sizes || [],
                  description: opt.description,
                  video: opt.videoIndex !== undefined ? colorVideoPaths[opt.videoIndex] : undefined,
                  images: opt.imageIndices.map(idx => {
                      usedIndices.add(idx);
                      return allPaths[idx];
                  }).filter(path => path)
              }));
              
              // Filter out all variant images from the general product gallery
              productData.images = allPaths.filter((_, idx) => !usedIndices.has(idx));
          } catch (e) {
              console.error("Error parsing colorOptions:", e);
          }
      }
    } else {
      productData.images = [];
      productData.colorOptions = [];
    }

    console.log("Final Product Data:", productData.name);
    const product = new Product(productData);
    const saved = await product.save();
    console.log("Product Saved Successfully!");

    res.status(201).json(saved);
  } catch (error) {
    console.error("Create Product CRASH:", error);
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
    const arrayFields = ["colors", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes", "tileUses"];
    arrayFields.forEach(key => {
        if (typeof productData[key] === 'string') {
            try { productData[key] = JSON.parse(productData[key]); } catch (e) {}
        }
    });

    const { images: mainImageFiles = [], colorImages: colorImageFiles = [], video: videoFiles = [], colorVideos: colorVideoFiles = [], images360: images360Files = [] } = req.files || {};
      
    if (videoFiles && videoFiles.length > 0) {
        productData.video = videoFiles[0].path;
    } else if (req.body.keepExistingVideo === 'false') {
        productData.video = "";
    }

    const colorVideoPaths = colorVideoFiles.map(f => f.path);

    // Handle images360
    if (images360Files.length > 0 || productData.existingImages360) {
      let final360 = [];
      if (typeof productData.existingImages360 === 'string') {
          try { final360 = JSON.parse(productData.existingImages360); } catch (e) {}
      } else if (Array.isArray(productData.existingImages360)) {
          final360 = productData.existingImages360;
      }
      const new360Paths = images360Files.map(f => f.path);
      productData.images360 = [...final360, ...new360Paths];
    } else if (req.body.keepExisting360 === 'false') {
      productData.images360 = [];
    }

    if (mainImageFiles.length > 0 || productData.existingImages) {
      let finalImages = [];
      if (typeof productData.existingImages === 'string') {
          try { finalImages = JSON.parse(productData.existingImages); } catch (e) {}
      } else if (Array.isArray(productData.existingImages)) {
          finalImages = productData.existingImages;
      }
      const newMainImagePaths = mainImageFiles.map(f => f.path);
      productData.images = [...finalImages, ...newMainImagePaths];
    } else if (productData.existingImages) {
      if (typeof productData.existingImages === 'string') {
          try { productData.images = JSON.parse(productData.existingImages); } catch (e) { productData.images = []; }
      } else if (Array.isArray(productData.existingImages)) {
          productData.images = productData.existingImages;
      }
    }

    // Handle colorOptionsEdit (new format from EditProduct.jsx)
    if (productData.colorOptionsEdit) {
      try {
        const colorOptionsEdit = JSON.parse(productData.colorOptionsEdit);
        const colorImagePaths = colorImageFiles.map(f => f.path);
        
        productData.colorOptions = colorOptionsEdit.map(opt => {
          const newImages = opt.newFileIndices.map(idx => colorImagePaths[idx]).filter(Boolean);
          let finalVideo = opt.existingVideo || "";
          if (opt.newVideoIndex !== undefined && colorVideoPaths[opt.newVideoIndex]) {
            finalVideo = colorVideoPaths[opt.newVideoIndex];
          } else if (opt.keepExistingVideo === false) {
            finalVideo = "";
          }

          return {
            color: opt.color,
            name: opt.name,
            price: Number(opt.price),
            sizes: opt.sizes || [],
            description: opt.description,
            video: finalVideo,
            images: [...(opt.existingImages || []), ...newImages]
          };
        });
      } catch (e) {
        console.error("Error parsing colorOptionsEdit:", e);
      }
    }
    // Handle legacy colorOptions format (from old routes)
    else if (typeof productData.colorOptions === 'string') {
        try { productData.colorOptions = JSON.parse(productData.colorOptions); } catch (e) {}
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, productData, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    console.error("Update Product Error:", error);
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