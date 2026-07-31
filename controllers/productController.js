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
    const arrayFields = ["colors", "shapes", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes", "tileUses", "variationColors", "mosaici", "applications", "supercollections"];
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
      colorCatalogs: colorCatalogFiles = [],
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
    const colorCatalogPaths = colorCatalogFiles.map(f => f.path);
    const colorImages360Paths = colorImages360Files.map(f => f.path);
    const variationColorImagePaths = variationColorImageFiles.map(f => f.path);


    // ✅ FIXED: Map colorOptions independently, not inside the main images block
    if (typeof productData.colorOptions === 'string') {
        try {
            const parsedOptions = JSON.parse(productData.colorOptions);
            console.log("BACKEND parsedOptions received:", parsedOptions);
            productData.colorOptions = parsedOptions.map(opt => ({
                color: opt.color,
                sku: opt.sku,
                colors: opt.colors || [],
                shapes: opt.shapes || [],
                shape: opt.shape || "",
                name: opt.name,
                productName: opt.productName || "",
                collectionName: opt.collectionName || "",
                catalog: (opt.catalogIndex !== undefined && colorCatalogPaths[opt.catalogIndex]) ? colorCatalogPaths[opt.catalogIndex] : (opt.catalog || ""),
                price: Number(opt.price),
                pricePerSqft: Number(opt.pricePerSqft) || 0,
                sqftPerBox: Number(opt.sqftPerBox) || 0,
                weightPerBox: Number(opt.weightPerBox) || 0,
                pricingUnit: opt.pricingUnit ? (opt.pricingUnit.charAt(0).toUpperCase() + opt.pricingUnit.slice(1).toLowerCase()) : "Box",
                size: opt.size,
                sizes: opt.sizes || [],
                mosaici: opt.mosaici || [],
                effects: opt.effects || [],
                finishes: opt.finishes || [],
                formats: opt.formats || [],
                applications: opt.applications || [],
                supercollections: opt.supercollections || [],
                description: opt.description,
                video: opt.videoIndex !== undefined ? colorVideoPaths[opt.videoIndex] : undefined,
                thumbnail: opt.thumbnailIndex !== undefined ? colorThumbnailPaths[opt.thumbnailIndex] : undefined,
                images: (opt.imageIndices || []).map(idx => colorImagePaths[idx]).filter(path => path),
                images360: (opt.images360Indices || []).map(idx => colorImages360Paths[idx]).filter(path => path)
            }));

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

    // Auto-aggregate colors, shapes, mosaici, effects, finishes, formats to root level
    const allOptColors = new Set(productData.colors || []);
    const allOptShapes = new Set(productData.shapes || []);
    const allOptMosaici = new Set(productData.mosaici || []);
    const allOptEffects = new Set(productData.effects || []);
    const allOptFinishes = new Set(productData.finishes || []);
    const allOptFormats = new Set(productData.formats || []);
    const allOptApplications = new Set(productData.applications || []);
    const allOptSupercollections = new Set(productData.supercollections || []);

    if (productData.colorOptions) {
        productData.colorOptions.forEach(opt => {
            if (opt.catalog && !productData.catalog) productData.catalog = opt.catalog;
            if (opt.colors) opt.colors.forEach(c => allOptColors.add(c));
            if (opt.color) allOptColors.add(opt.color);
            if (opt.shapes) opt.shapes.forEach(s => allOptShapes.add(s));
            if (opt.shape) allOptShapes.add(opt.shape);
            if (opt.mosaici) opt.mosaici.forEach(m => allOptMosaici.add(m));
            if (opt.effects) opt.effects.forEach(e => allOptEffects.add(e));
            if (opt.finishes) opt.finishes.forEach(f => allOptFinishes.add(f));
            if (opt.formats) opt.formats.forEach(f => allOptFormats.add(f));
            if (opt.applications) opt.applications.forEach(a => allOptApplications.add(a));
            if (opt.supercollections) opt.supercollections.forEach(sc => allOptSupercollections.add(sc));
        });
    }

    if (Array.isArray(productData.variationColors)) {
        productData.variationColors.forEach(vc => {
            if (typeof vc === 'string') allOptColors.add(vc);
            else if (vc && vc.name) allOptColors.add(vc.name);
        });
    }

    productData.colors = Array.from(allOptColors);
    productData.shapes = Array.from(allOptShapes);
    productData.mosaici = Array.from(allOptMosaici);
    productData.effects = Array.from(allOptEffects);
    productData.finishes = Array.from(allOptFinishes);
    productData.formats = Array.from(allOptFormats);
    productData.applications = Array.from(allOptApplications);
    productData.supercollections = Array.from(allOptSupercollections);

    console.log("Final Product Data:", productData.name, "colorOptions:", JSON.stringify(productData.colorOptions, null, 2));
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
    if (series) filter.series = { $regex: new RegExp(`^${series}$`, 'i') };
    if (effect) filter.effects = { $regex: new RegExp(`^${effect}$`, 'i') };
    if (format) filter.formats = { $regex: new RegExp(`^${format}$`, 'i') };
    if (color) filter.colors = { $regex: new RegExp(`^${color}$`, 'i') };
    if (shape) {
      const shapeRegex = new RegExp(`^${shape}$`, 'i');
      filter.$or = [
        { shapes: shapeRegex },
        { shape: shapeRegex }
      ];
    }
    if (style) filter.styles = { $regex: new RegExp(`^${style}$`, 'i') };
    if (material) filter.materials = { $regex: new RegExp(`^${material}$`, 'i') };
    if (size) {
      const sizeRegex = new RegExp(`^${size}$`, 'i');
      filter.$or = [
        { sizes: sizeRegex },
        { size: sizeRegex }
      ];
    }
    if (look) filter.looks = { $regex: new RegExp(`^${look}$`, 'i') };
    if (finish) filter.finishes = { $regex: new RegExp(`^${finish}$`, 'i') };

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
        // Strict color filter (case-insensitive)
        filter.colors = { $regex: new RegExp(`^${matchedColor}$`, 'i') };
      } else if (matchedShape) {
        // Strict shape filter (case-insensitive)
        const shapeRegex = new RegExp(`^${matchedShape}$`, 'i');
        filter.$or = [
          { shapes: shapeRegex },
          { shape: shapeRegex }
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
    
    let formattedProducts = [];

    if (req.query.admin === "true") {
      // Original logic for Admin panel (no splitting)
      formattedProducts = products.map(p => {
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
    } else {
      // Split variations for frontend
      products.forEach(p => {
        const prod = p.toObject();
        console.log("DEBUG: product =", prod.name, "colorOptions count =", prod.colorOptions ? prod.colorOptions.length : 0);
        if (prod.colorOptions && prod.colorOptions.length > 0) {
          prod.colorOptions.forEach((opt, idx) => {
            // Apply filtering logic to variation options if filters are present
            let matches = true;

            if (color) {
              const varColors = opt.colors && opt.colors.length > 0 ? opt.colors : (opt.color ? [opt.color] : []);
              if (!varColors.some(c => c?.toLowerCase() === color.toLowerCase())) {
                matches = false;
              }
            }
            if (shape) {
              const varShapes = opt.shapes && opt.shapes.length > 0 ? opt.shapes : (opt.shape ? [opt.shape] : []);
              if (!varShapes.some(s => s?.toLowerCase() === shape.toLowerCase())) {
                matches = false;
              }
            }
            if (size) {
              const varSizes = opt.sizes && opt.sizes.length > 0 ? opt.sizes : (opt.size ? [opt.size] : []);
              if (!varSizes.some(s => s?.toLowerCase() === size.toLowerCase())) {
                matches = false;
              }
            }
            if (effect) {
              const varEffects = opt.effects || [];
              if (!varEffects.some(e => e?.toLowerCase() === effect.toLowerCase())) {
                matches = false;
              }
            }
            if (finish) {
              const varFinishes = opt.finishes || [];
              if (!varFinishes.some(f => f?.toLowerCase() === finish.toLowerCase())) {
                matches = false;
              }
            }
            if (format) {
              const varFormats = opt.formats || [];
              if (!varFormats.some(f => f?.toLowerCase() === format.toLowerCase())) {
                matches = false;
              }
            }
            if (search) {
              const searchLower = search.trim().toLowerCase();
              const nameMatch = (opt.productName || "").toLowerCase().includes(searchLower) || (opt.name || "").toLowerCase().includes(searchLower) || prod.name.toLowerCase().includes(searchLower);
              const descMatch = (opt.description || "").toLowerCase().includes(searchLower) || (prod.description || "").toLowerCase().includes(searchLower);
              const colorMatch = (opt.colors || []).some(c => c?.toLowerCase().includes(searchLower)) || (opt.color && opt.color.toLowerCase().includes(searchLower)) || (prod.colors || []).some(c => c?.toLowerCase().includes(searchLower));
              const shapeMatch = (opt.shapes || []).some(s => s?.toLowerCase().includes(searchLower)) || (opt.shape && opt.shape.toLowerCase().includes(searchLower)) || (prod.shapes || []).some(s => s?.toLowerCase().includes(searchLower));
              const categoryMatch = (prod.category || "").toLowerCase().includes(searchLower);
              const seriesMatch = (prod.series || "").toLowerCase().includes(searchLower);
              
              const effectsMatch = (opt.effects || []).some(e => e?.toLowerCase().includes(searchLower)) || (prod.effects || []).some(e => e?.toLowerCase().includes(searchLower));
              const formatsMatch = (opt.formats || []).some(f => f?.toLowerCase().includes(searchLower)) || (prod.formats || []).some(f => f?.toLowerCase().includes(searchLower));
              const tileUsesMatch = (prod.tileUses || []).some(tu => tu?.toLowerCase().includes(searchLower));
              const stylesMatch = (prod.styles || []).some(s => s?.toLowerCase().includes(searchLower));
              const materialsMatch = (prod.materials || []).some(m => m?.toLowerCase().includes(searchLower));
              const looksMatch = (prod.looks || []).some(l => l?.toLowerCase().includes(searchLower));
              const finishesMatch = (opt.finishes || []).some(f => f?.toLowerCase().includes(searchLower)) || (prod.finishes || []).some(f => f?.toLowerCase().includes(searchLower));
              const mosaiciMatch = (prod.mosaici || []).some(m => m?.toLowerCase().includes(searchLower)) || (opt.mosaici || []).some(m => m?.toLowerCase().includes(searchLower));
              const applicationsMatch = (opt.applications || []).some(a => a?.toLowerCase().includes(searchLower)) || (prod.applications || []).some(a => a?.toLowerCase().includes(searchLower));
              const supercollectionsMatch = (opt.supercollections || []).some(sc => sc?.toLowerCase().includes(searchLower)) || (prod.supercollections || []).some(sc => sc?.toLowerCase().includes(searchLower));

              if (!nameMatch && !descMatch && !colorMatch && !shapeMatch && !categoryMatch && !seriesMatch &&
                  !effectsMatch && !formatsMatch && !tileUsesMatch && !stylesMatch && !materialsMatch &&
                  !looksMatch && !finishesMatch && !mosaiciMatch && !applicationsMatch && !supercollectionsMatch) {
                matches = false;
              }
            }

            if (matches) {
              const varProd = {
                ...prod,
                _id: `${prod._id}-${idx}`,
                sku: opt.sku || prod.sku,
                name: opt.productName || (opt.name ? `${prod.name} - ${opt.name}` : prod.name),
                title: opt.productName || (opt.name ? `${prod.name} - ${opt.name}` : prod.name),
                price: opt.price || prod.price,
                pricePerSqft: opt.pricePerSqft || prod.pricePerSqft,
                sqftPerBox: opt.sqftPerBox || prod.sqftPerBox,
                weightPerBox: opt.weightPerBox || prod.weightPerBox,
                pricingUnit: opt.pricingUnit || prod.pricingUnit,
                description: opt.description || prod.description,
                images: (opt.images && opt.images.length > 0) ? opt.images : (prod.images || []),
                video: opt.video || prod.video,
                images360: (opt.images360 && opt.images360.length > 0) ? opt.images360 : (prod.images360 || []),
                colors: opt.colors && opt.colors.length > 0 ? opt.colors : (opt.color ? [opt.color] : prod.colors),
                shapes: opt.shapes && opt.shapes.length > 0 ? opt.shapes : (opt.shape ? [opt.shape] : prod.shapes),
                sizes: opt.sizes && opt.sizes.length > 0 ? opt.sizes : (opt.size ? [opt.size] : prod.sizes),
                mosaici: opt.mosaici && opt.mosaici.length > 0 ? opt.mosaici : prod.mosaici,
                effects: opt.effects && opt.effects.length > 0 ? opt.effects : prod.effects,
                finishes: opt.finishes && opt.finishes.length > 0 ? opt.finishes : prod.finishes,
                formats: opt.formats && opt.formats.length > 0 ? opt.formats : prod.formats,
                applications: opt.applications && opt.applications.length > 0 ? opt.applications : prod.applications,
                supercollections: opt.supercollections && opt.supercollections.length > 0 ? opt.supercollections : prod.supercollections,
                catalog: opt.catalog || prod.catalog || "",
                variationName: opt.name || opt.color,
                variationIndex: idx,
                selectedVariation: opt
              };
              formattedProducts.push(varProd);
            }
          });
        } else {
          // If no variations exist, add the main product
          formattedProducts.push(prod);
        }
      });
    }

    console.log(`Found ${formattedProducts.length} products for filter:`, filter);
    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    let prodId = req.params.id;
    if (prodId.includes("-")) {
      prodId = prodId.split("-")[0];
    }
    const product = await Product.findById(prodId);
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
        const allColorOptions = (product.colorOptions || []).map(opt => ({
          ...opt.toObject(),
          parentId: product._id
        }));
        
        const allSizes = new Set(product.sizes || []);
        const allVariationColors = [...(product.variationColors || [])];

        // Series-wide attributes merging
        const allEffects = new Set(product.effects || []);
        const allFormats = new Set(product.formats || []);
        const allColors = new Set(product.colors || []);
        const allTileUses = new Set(product.tileUses || []);
        const allStyles = new Set(product.styles || []);
        const allMaterials = new Set(product.materials || []);
        const allLooks = new Set(product.looks || []);
        const allFinishes = new Set(product.finishes || []);
        const allMosaici = new Set(product.mosaici || []);

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

          // Merge parent attributes
          if (sib.effects) sib.effects.forEach(e => allEffects.add(e));
          if (sib.formats) sib.formats.forEach(f => allFormats.add(f));
          if (sib.colors) sib.colors.forEach(c => allColors.add(c));
          if (sib.tileUses) sib.tileUses.forEach(tu => allTileUses.add(tu));
          if (sib.styles) sib.styles.forEach(s => allStyles.add(s));
          if (sib.materials) sib.materials.forEach(m => allMaterials.add(m));
          if (sib.looks) sib.looks.forEach(l => allLooks.add(l));
          if (sib.finishes) sib.finishes.forEach(f => allFinishes.add(f));
          if (sib.mosaici) sib.mosaici.forEach(m => allMosaici.add(m));
        });

        mergedProduct.colorOptions = allColorOptions;
        mergedProduct.sizes = Array.from(allSizes);
        mergedProduct.variationColors = allVariationColors;

        mergedProduct.effects = Array.from(allEffects);
        mergedProduct.formats = Array.from(allFormats);
        mergedProduct.colors = Array.from(allColors);
        mergedProduct.tileUses = Array.from(allTileUses);
        mergedProduct.styles = Array.from(allStyles);
        mergedProduct.materials = Array.from(allMaterials);
        mergedProduct.looks = Array.from(allLooks);
        mergedProduct.finishes = Array.from(allFinishes);
        mergedProduct.mosaici = Array.from(allMosaici);

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
          mergedProduct.weightPerBox = mergedProduct.colorOptions[0].weightPerBox || 0;
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
      mergedProduct.weightPerBox = mergedProduct.colorOptions[0].weightPerBox || 0;
    }

    res.json(mergedProduct);
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    let { id } = req.params;
    if (id.includes("-")) {
      id = id.split("-")[0];
    }
    const productData = { ...req.body };
    
    // Normalize pricingUnit to match Mongoose enum (Capitalized)
    if (productData.pricingUnit) {
      const unit = productData.pricingUnit.toLowerCase();
      productData.pricingUnit = unit.charAt(0).toUpperCase() + unit.slice(1); // "sheet" -> "Sheet"
    }
    
    // Parse arrays that were stringified via FormData
    const arrayFields = ["colors", "effects", "formats", "styles", "materials", "sizes", "looks", "finishes", "customSizes", "tileUses", "variationColors", "mosaici", "applications", "supercollections"];
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
      colorCatalogs: colorCatalogFiles = [],
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
    const colorCatalogPaths = colorCatalogFiles.map(f => f.path);
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
          const newImages = (opt.newFileIndices || []).map(idx => colorImagePaths[idx]).filter(Boolean);
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
            collectionName: opt.collectionName || "",
            catalog: (opt.newCatalogIndex !== undefined && colorCatalogPaths[opt.newCatalogIndex]) ? colorCatalogPaths[opt.newCatalogIndex] : (opt.existingCatalog || opt.catalog || ""),
            price: Number(opt.price),
            pricePerSqft: Number(opt.pricePerSqft) || 0,
            sqftPerBox: Number(opt.sqftPerBox) || 0,
            weightPerBox: Number(opt.weightPerBox) || 0,
            pricingUnit: opt.pricingUnit ? (opt.pricingUnit.charAt(0).toUpperCase() + opt.pricingUnit.slice(1).toLowerCase()) : "Box",
            sizes: opt.sizes || [],
            mosaici: opt.mosaici || [],
            effects: opt.effects || [],
            finishes: opt.finishes || [],
            formats: opt.formats || [],
            applications: opt.applications || [],
            supercollections: opt.supercollections || [],
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

    // Auto-aggregate colors, shapes, mosaici, effects, finishes, formats to root level
    const allOptColors = new Set(productData.colors || productToUpdate.colors || []);
    const allOptShapes = new Set(productData.shapes || productToUpdate.shapes || []);
    const allOptMosaici = new Set(productData.mosaici || productToUpdate.mosaici || []);
    const allOptEffects = new Set(productData.effects || productToUpdate.effects || []);
    const allOptFinishes = new Set(productData.finishes || productToUpdate.finishes || []);
    const allOptFormats = new Set(productData.formats || productToUpdate.formats || []);
    const allOptApplications = new Set(productData.applications || productToUpdate.applications || []);
    const allOptSupercollections = new Set(productData.supercollections || productToUpdate.supercollections || []);

    const mergedColorOptions = productData.colorOptions || productToUpdate.colorOptions || [];
    mergedColorOptions.forEach(opt => {
        if (opt.catalog && !productData.catalog) productData.catalog = opt.catalog;
        if (opt.colors) opt.colors.forEach(c => allOptColors.add(c));
        if (opt.color) allOptColors.add(opt.color);
        if (opt.shapes) opt.shapes.forEach(s => allOptShapes.add(s));
        if (opt.shape) allOptShapes.add(opt.shape);
        if (opt.mosaici) opt.mosaici.forEach(m => allOptMosaici.add(m));
        if (opt.effects) opt.effects.forEach(e => allOptEffects.add(e));
        if (opt.finishes) opt.finishes.forEach(f => allOptFinishes.add(f));
        if (opt.formats) opt.formats.forEach(f => allOptFormats.add(f));
        if (opt.applications) opt.applications.forEach(a => allOptApplications.add(a));
        if (opt.supercollections) opt.supercollections.forEach(sc => allOptSupercollections.add(sc));
    });

    const mergedVariationColors = productData.variationColors || productToUpdate.variationColors || [];
    mergedVariationColors.forEach(vc => {
        if (typeof vc === 'string') allOptColors.add(vc);
        else if (vc && vc.name) allOptColors.add(vc.name);
    });

    productData.colors = Array.from(allOptColors);
    productData.shapes = Array.from(allOptShapes);
    productData.mosaici = Array.from(allOptMosaici);
    productData.effects = Array.from(allOptEffects);
    productData.finishes = Array.from(allOptFinishes);
    productData.formats = Array.from(allOptFormats);
    productData.applications = Array.from(allOptApplications);
    productData.supercollections = Array.from(allOptSupercollections);

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
    let { id } = req.params;
    if (id.includes("-")) {
      id = id.split("-")[0];
    }
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};