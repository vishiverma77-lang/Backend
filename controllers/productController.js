import Product from "../models/Product.js";
import Attribute from "../models/Attribute.js";

export const createProduct = async (req, res) => {
  console.log("Create Product Triggered...");
  console.log("Body Items:", Object.keys(req.body));
  console.log("Files received:", Object.keys(req.files || {}));

  try {
    const productData = { ...req.body };
    
    // Normalize pricingUnit to match Mongoose enum (Capitalized)
    if (productData.pricingUnit) {
      const unit = productData.pricingUnit.toLowerCase();
      productData.pricingUnit = unit.charAt(0).toUpperCase() + unit.slice(1); // "sheet" -> "Sheet"
    }

    // Parse arrays that were stringified via FormData
    const arrayFields = ["colors", "shapes", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes", "tileUses", "variationColors"];
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
      colorImages360: colorImages360Files = [],
      variationColorImages: variationColorImageFiles = []
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
    const variationColorImagePaths = variationColorImageFiles.map(f => f.path);


    // ✅ FIXED: Map colorOptions independently, not inside the main images block
    if (typeof productData.colorOptions === 'string') {
        try {
            const parsedOptions = JSON.parse(productData.colorOptions);
            productData.colorOptions = parsedOptions.map(opt => ({
                color: opt.color,
                sku: opt.sku,
                colors: opt.colors || [],
                shapes: opt.shapes || [],
                shape: opt.shape || "",
                name: opt.name,
                productName: opt.productName || "",
                price: Number(opt.price),
                pricePerSqft: Number(opt.pricePerSqft),
                sqftPerBox: Number(opt.sqftPerBox),
                pricingUnit: opt.pricingUnit ? (opt.pricingUnit.charAt(0).toUpperCase() + opt.pricingUnit.slice(1).toLowerCase()) : "Box",
                size: opt.size,
                sizes: opt.sizes || [],
                description: opt.description,
                video: opt.videoIndex !== undefined ? colorVideoPaths[opt.videoIndex] : undefined,
                thumbnail: opt.thumbnailIndex !== undefined ? colorThumbnailPaths[opt.thumbnailIndex] : undefined,
                images: (opt.imageIndices || []).map(idx => colorImagePaths[idx]).filter(path => path),
                images360: (opt.images360Indices || []).map(idx => colorImages360Paths[idx]).filter(path => path)
            }));

            // Auto-aggregate colors and shapes from variations to root level for filtering
            const allOptColors = new Set(productData.colors || []);
            const allOptShapes = new Set(productData.shapes || []);
            productData.colorOptions.forEach(opt => {
                if (opt.colors) opt.colors.forEach(c => allOptColors.add(c));
                if (opt.color) allOptColors.add(opt.color);
                if (opt.shapes) opt.shapes.forEach(s => allOptShapes.add(s));
                if (opt.shape) allOptShapes.add(opt.shape);
            });
            productData.colors = Array.from(allOptColors);
            productData.shapes = Array.from(allOptShapes);

            console.log("Color options mapped:", productData.colorOptions.map(o => ({ color: o.color, shapes: o.shapes, imgCount: o.images.length, img360Count: o.images360.length })));
        } catch (e) {
            console.error("Error parsing colorOptions:", e);
            productData.colorOptions = [];
        }
    
    // Map variationColorImages to variationColors array using variationColorIndices
    if (Array.isArray(productData.variationColors)) {
        try {
            const indices = JSON.parse(productData.variationColorIndices || "[]");
            productData.variationColors = productData.variationColors.map((colorName, idx) => {
                const uIdx = indices[idx];
                const imgPath = (uIdx !== null && uIdx !== undefined) ? variationColorImagePaths[uIdx] : "";
                return { name: colorName, image: imgPath };
            });
        } catch (e) {
            console.error("Error mapping variationColors in create:", e);
        }
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
    const { effect, format, color, shape, style, material, size, look, finish, search, series } = req.query;
    if (series) filter.series = series;
    if (effect) filter.effects = effect;
    if (format) filter.formats = format;
    if (color) filter.colors = color;
    if (shape) filter.shapes = shape;
    if (style) filter.styles = style;
    if (material) filter.materials = material;
    if (size) filter.sizes = size;
    if (look) filter.looks = look;
    if (finish) filter.finishes = finish;

    // Unified search for all tags, uses, category, description and name
    if (search) {
      const searchLower = search.trim().toLowerCase();
      
      // Fetch dynamic colors and shapes lists from Attribute model
      const colorsAttribute = await Attribute.findOne({ name: "colors" });
      const shapesAttribute = await Attribute.findOne({ name: "shapes" });
      const colorsList = colorsAttribute ? colorsAttribute.values : [];
      const shapesList = shapesAttribute ? shapesAttribute.values : [];
      
      const matchedColor = colorsList.find(c => c.toLowerCase() === searchLower);
      const matchedShape = shapesList.find(s => s.toLowerCase() === searchLower);
      
      if (matchedColor) {
        // Strict color filter: only show cards that have this color assigned
        filter.colors = matchedColor;
      } else if (matchedShape) {
        // Strict shape filter: only show cards that have this shape assigned
        filter.$or = [
          { shapes: matchedShape },
          { shape: matchedShape }
        ];
      } else {
        // Fallback to standard unified search regex
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
          { shapes: searchRegex },
          { shape: searchRegex },
          { styles: searchRegex },
          { materials: searchRegex },
          { sizes: searchRegex },
          { looks: searchRegex },
          { finishes: searchRegex }
        ];
      }
    }

    const products = await Product.find(filter);
    
    // Add fallback to first variation if main visual/description is missing
    const formattedProducts = products.map(p => {
      const prod = p.toObject();
      if ((!prod.images || prod.images.length === 0) && prod.colorOptions && prod.colorOptions.length > 0) {
        prod.images = prod.colorOptions[0].images || [];
      }
      if (!prod.description && prod.colorOptions && prod.colorOptions.length > 0) {
        prod.description = prod.colorOptions[0].description || "";
      }
      if (!prod.video && prod.colorOptions && prod.colorOptions.length > 0) {
        prod.video = prod.colorOptions[0].video || "";
      }
      if ((!prod.images360 || prod.images360.length === 0) && prod.colorOptions && prod.colorOptions.length > 0) {
        prod.images360 = prod.colorOptions[0].images360 || [];
      }
      if ((!prod.price || prod.price === 0) && prod.colorOptions && prod.colorOptions.length > 0) {
        prod.price = prod.colorOptions[0].price || 0;
        prod.pricingUnit = prod.colorOptions[0].pricingUnit || "Box";
        prod.pricePerSqft = prod.colorOptions[0].pricePerSqft || 0;
        prod.sqftPerBox = prod.colorOptions[0].sqftPerBox || 0;
      }
      return prod;
    });

    console.log(`Found ${formattedProducts.length} products for filter:`, filter);
    if (formattedProducts.length > 0) {
      console.log("Product names:", formattedProducts.map(p => p.name).join(", "));
      console.log("Product series:", formattedProducts.map(p => p.series).join(", "));
    }
    res.json(formattedProducts);
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

    // If it's part of a series, fetch all siblings to merge variations and sizes
    if (product.series) {
      const seriesName = product.series.trim();
      // Escape special characters so regex doesn't crash
      const escapedSeriesName = seriesName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Find all products in the same series (case-insensitive)
      const siblings = await Product.find({ 
        series: { $regex: new RegExp(`^${escapedSeriesName}$`, 'i') },
        _id: { $ne: product._id }
      });

      if (siblings.length > 0) {
        const mergedProduct = product.toObject();
        
        // Initialize merged arrays with original product data, marking them with parentId
        const allColorOptions = (mergedProduct.colorOptions || []).map(opt => ({
          ...opt,
          parentId: product._id
        }));
        
        const allSizes = new Set(product.sizes || []);
        const allVariationColors = [...(product.variationColors || [])];

        // Merge from siblings
        siblings.forEach(sib => {
          // Merge colorOptions
          if (sib.colorOptions) {
            sib.colorOptions.forEach(opt => {
              // Avoid duplicates by SKU if needed, but for now just merge
              allColorOptions.push({
                ...opt.toObject(),
                parentId: sib._id
              });
            });
          }
          
          // Merge sizes
          if (sib.sizes) {
            sib.sizes.forEach(s => allSizes.add(s));
          }
          
          // Merge variationColors (the swatch icons)
          if (sib.variationColors) {
            sib.variationColors.forEach(vc => {
              if (!allVariationColors.find(existing => existing.name === vc.name)) {
                allVariationColors.push(vc.toObject());
              }
            });
          }
        });

        mergedProduct.colorOptions = allColorOptions;
        mergedProduct.sizes = Array.from(allSizes);
        mergedProduct.variationColors = allVariationColors;

        if ((!mergedProduct.images || mergedProduct.images.length === 0) && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
          mergedProduct.images = mergedProduct.colorOptions[0].images || [];
        }
        if (!mergedProduct.description && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
          mergedProduct.description = mergedProduct.colorOptions[0].description || "";
        }
        if (!mergedProduct.video && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
          mergedProduct.video = mergedProduct.colorOptions[0].video || "";
        }
        if ((!mergedProduct.images360 || mergedProduct.images360.length === 0) && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
          mergedProduct.images360 = mergedProduct.colorOptions[0].images360 || [];
        }
        if ((!mergedProduct.price || mergedProduct.price === 0) && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
          mergedProduct.price = mergedProduct.colorOptions[0].price || 0;
          mergedProduct.pricingUnit = mergedProduct.colorOptions[0].pricingUnit || "Box";
          mergedProduct.pricePerSqft = mergedProduct.colorOptions[0].pricePerSqft || 0;
          mergedProduct.sqftPerBox = mergedProduct.colorOptions[0].sqftPerBox || 0;
        }

        return res.json(mergedProduct);
      }
    }

    const mergedProduct = product.toObject();
    if ((!mergedProduct.images || mergedProduct.images.length === 0) && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
      mergedProduct.images = mergedProduct.colorOptions[0].images || [];
    }
    if (!mergedProduct.description && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
      mergedProduct.description = mergedProduct.colorOptions[0].description || "";
    }
    if (!mergedProduct.video && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
      mergedProduct.video = mergedProduct.colorOptions[0].video || "";
    }
    if ((!mergedProduct.images360 || mergedProduct.images360.length === 0) && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
      mergedProduct.images360 = mergedProduct.colorOptions[0].images360 || [];
    }
    if ((!mergedProduct.price || mergedProduct.price === 0) && mergedProduct.colorOptions && mergedProduct.colorOptions.length > 0) {
      mergedProduct.price = mergedProduct.colorOptions[0].price || 0;
      mergedProduct.pricingUnit = mergedProduct.colorOptions[0].pricingUnit || "Box";
      mergedProduct.pricePerSqft = mergedProduct.colorOptions[0].pricePerSqft || 0;
      mergedProduct.sqftPerBox = mergedProduct.colorOptions[0].sqftPerBox || 0;
    }

    res.json(mergedProduct);
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = { ...req.body };
    
    // Normalize pricingUnit to match Mongoose enum (Capitalized)
    if (productData.pricingUnit) {
      const unit = productData.pricingUnit.toLowerCase();
      productData.pricingUnit = unit.charAt(0).toUpperCase() + unit.slice(1); // "sheet" -> "Sheet"
    }
    
    // Parse arrays that were stringified via FormData
    const arrayFields = ["colors", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes", "tileUses", "variationColors"];
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
      colorImages360: colorImages360Files = [],
      variationColorImages: variationColorImageFiles = []
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
            sku: opt.sku,
            colors: opt.colors || [],
            shapes: opt.shapes || [],
            shape: opt.shape || "",
            name: opt.name,
            productName: opt.productName || "",
            price: Number(opt.price),
            pricePerSqft: Number(opt.pricePerSqft),
            sqftPerBox: Number(opt.sqftPerBox),
            pricingUnit: opt.pricingUnit ? (opt.pricingUnit.charAt(0).toUpperCase() + opt.pricingUnit.slice(1).toLowerCase()) : "Box",
            sizes: opt.sizes || [],
            description: opt.description,
            thumbnail: (opt.newThumbnailIndex !== undefined && colorThumbnailPaths[opt.newThumbnailIndex]) ? colorThumbnailPaths[opt.newThumbnailIndex] : (opt.existingThumbnail || ""),
            video: finalVideo,
            images: [...(opt.existingImages || []), ...newImages],
            images360: [...(opt.existingImages360 || []), ...((opt.newImages360Indices || []).map(idx => colorImages360Paths[idx]).filter(Boolean))]
          };
        });

        // Auto-aggregate colors and shapes from variations to root level for filtering in update
        const allOptColors = new Set(productData.colors || []);
        const allOptShapes = new Set(productData.shapes || []);
        productData.colorOptions.forEach(opt => {
            if (opt.colors) opt.colors.forEach(c => allOptColors.add(c));
            if (opt.color) allOptColors.add(opt.color);
            if (opt.shapes) opt.shapes.forEach(s => allOptShapes.add(s));
            if (opt.shape) allOptShapes.add(opt.shape);
        });
        productData.colors = Array.from(allOptColors);
        productData.shapes = Array.from(allOptShapes);

      } catch (e) {
        console.error("Error parsing colorOptionsEdit:", e);
      }
    }

    // Handle variationColors update in updateProduct
    if (productData.variationColors) {
        try {
            const names = typeof productData.variationColors === 'string' ? JSON.parse(productData.variationColors) : productData.variationColors;
            const existingImages = JSON.parse(productData.existingVariationColorImages || "[]");
            const uploadIndices = JSON.parse(productData.variationColorIndices || "[]");
            const newImagePaths = variationColorImageFiles.map(f => f.path);


            productData.variationColors = names.map((name, idx) => {
                let img = existingImages[idx] || "";
                const uIdx = uploadIndices[idx];
                if (uIdx !== null && uIdx !== undefined && newImagePaths[uIdx]) {
                    img = newImagePaths[uIdx];
                }
                return { name, image: img };
            });
        } catch (e) {
            console.error("Error updating variationColors:", e);
        }
    }

    // Handle legacy colorOptions format (from old routes)
    else if (typeof productData.colorOptions === 'string') {
        try { productData.colorOptions = JSON.parse(productData.colorOptions); } catch (e) {}
    }

    // Ensure Mongoose knows colorOptions and variationColors are modified
    const productToUpdate = await Product.findById(id);
    if (!productToUpdate) return res.status(404).json({ message: "Product not found" });

    // Update fields
    Object.assign(productToUpdate, productData);
    productToUpdate.markModified('colorOptions');
    productToUpdate.markModified('variationColors');
    
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