import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  price: Number,
  pricePerSqft: Number,
  sqftPerBox: Number,
  piecesPerBox: Number,
  weightPerBox: Number,
  pricingUnit: { type: String, enum: ["Box", "Sheet"], default: "Box" },
  description: String,
  images: [String],
  category: String,
  series: String,
  video: String,
  images360: [String],
  brand: String,
  rating: { type: Number, default: 5.0 },
  reviews: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },

  formats: [String],
  colors: [String],
  shapes: [String],
  shape: String,
  sizes: [String],
  tileUses: [String],
  styles: [String],
  materials: [String],
  looks: [String],
  finishes: [String],
  effects: [String],
  mosaici: [String],
  applications: [String],
  supercollections: [String],
  variationColors: [{
    name: String,
    image: String
  }],

  catalog: String,
  colorOptions: [{
    sku: String,
    color: String,
    colors: [String],
    shapes: [String],
    shape: String,
    images: [String],
    name: String,
    productName: String,
    collectionName: String,
    catalog: String,
    price: Number,
    pricePerSqft: Number,
    sqftPerBox: Number,
    weightPerBox: Number,
    pricingUnit: { type: String, enum: ["Box", "Sheet"], default: "Box" },
    size: String,
    sizes: [String],
    mosaici: [String],
    effects: [String],
    finishes: [String],
    formats: [String],
    applications: [String],
    supercollections: [String],
    description: String,
    video: String,
    thumbnail: String,
    images360: [String]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Product", productSchema);