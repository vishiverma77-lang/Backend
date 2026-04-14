import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  console.log("Create Product Triggered...");
  console.log("Body Items:", Object.keys(req.body));
  console.log("Files received:", Object.keys(req.files || {}));

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

    // ✅ FIXED: Extract ALL file groups, including colorImages
    const { 
      images: mainImageFiles = [], 
      video: videoFiles = [], 
      colorImages: colorImageFiles = [],
      colorThumbnails: colorThumbnailFiles = [],
      colorVideos: colorVideoFiles = [], 
      images360: images360Files = [],
      colorImages360: colorImages360Files = []
    } = req.files || {};
      
    if (videoFiles && videoFiles.length > 0) {
      productData.video = videoFiles[0].path;
    }

    productData.images360 = images360Files.map(f => f.path);

    // Main product images
    productData.images = mainImageFiles.map(f => f.path);

    // Color variation image and video paths (separate from main images)
    const colorImagePaths = colorImageFiles.map(f => f.path);
    const colorVideoPaths = colorVideoFiles.map(f => f.path);
    const colorThumbnailPaths = colorThumbnailFiles.map(f => f.path);
    const colorImages360Paths = colorImages360Files.map(f => f.path);

    // ✅ FIXED: Map colorOptions independently, not inside the main images block
    if (typeof productData.colorOptions === 'string') {
        try {
            const parsedOptions = JSON.parse(productData.colorOptions);
            productData.colorOptions = parsedOptions.map(opt => ({
                color: opt.color,
                colors: opt.colors || [],
                name: opt.name,
                productName: opt.productName || "",
                price: Number(opt.price),
                pricePerSqft: Number(opt.pricePerSqft),
                sqftPerBox: Number(opt.sqftPerBox),
                size: opt.size,
                sizes: opt.sizes || [],
                description: opt.description,
                video: opt.videoIndex !== undefined ? colorVideoPaths[opt.videoIndex] : undefined,
                thumbnail: opt.thumbnailIndex !== undefined ? colorThumbnailPaths[opt.thumbnailIndex] : undefined,
                images: (opt.imageIndices || []).map(idx => colorImagePaths[idx]).filter(path => path),
                images360: (opt.images360Indices || []).map(idx => colorImages360Paths[idx]).filter(path => path)
            }));
            console.log("Color options mapped:", productData.colorOptions.map(o => ({ color: o.color, imgCount: o.images.length, img360Count: o.images360.length })));
        } catch (e) {
            console.error("Error parsing colorOptions:", e);
            productData.colorOptions = [];
        }
    }

    console.log("Final Product Data:", productData.name);
    const product = new Product(productData);
    const saved = await product.save();
    console.log("Product Saved Successfully!");

    res.status(201).json(saved);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const filter = {};
    const { effect, format, color, style, material, size, look, finish, search, series } = req.query;
    if (series) filter.series = series;
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
        { series: searchRegex },
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

    const { 
      images: mainImageFiles = [], 
      colorImages: colorImageFiles = [], 
      colorThumbnails: colorThumbnailFiles = [],
      video: videoFiles = [], 
      colorVideos: colorVideoFiles = [], 
      images360: images360Files = [],
      colorImages360: colorImages360Files = []
    } = req.files || {};
      
    if (videoFiles && videoFiles.length > 0) {
        productData.video = videoFiles[0].path;
    } else if (req.body.keepExistingVideo === 'false') {
        productData.video = "";
    }

    const colorVideoPaths = colorVideoFiles.map(f => f.path);
    const colorThumbnailPaths = colorThumbnailFiles.map(f => f.path);
    const colorImages360Paths = colorImages360Files.map(f => f.path);

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
            colors: opt.colors || [],
            name: opt.name,
            productName: opt.productName || "",
            price: Number(opt.price),
            pricePerSqft: Number(opt.pricePerSqft),
            sqftPerBox: Number(opt.sqftPerBox),
            sizes: opt.sizes || [],
            description: opt.description,
            thumbnail: (opt.newThumbnailIndex !== undefined && colorThumbnailPaths[opt.newThumbnailIndex]) ? colorThumbnailPaths[opt.newThumbnailIndex] : (opt.existingThumbnail || ""),
            video: finalVideo,
            images: [...(opt.existingImages || []), ...newImages],
            images360: [...(opt.existingImages360 || []), ...((opt.newImages360Indices || []).map(idx => colorImages360Paths[idx]).filter(Boolean))]
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

    // Ensure Mongoose knows colorOptions is modified
    const productToUpdate = await Product.findById(id);
    if (!productToUpdate) return res.status(404).json({ message: "Product not found" });

    // Update fields
    Object.assign(productToUpdate, productData);
    productToUpdate.markModified('colorOptions');
    
    const updatedProduct = await productToUpdate.save();
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