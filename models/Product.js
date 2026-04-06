import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  pricePerSqft: Number,
  sqftPerBox: Number,
  description: String,
  images: [String],
  category: String,
  series: String,
  video: String,
  images360: [String],

  formats: [String],
  colors: [String],
  sizes: [String],
  tileUses: [String],
  styles: [String],
  materials: [String],
  looks: [String],
  finishes: [String],
  effects: [String],

  colorOptions: [{
    color: String,
    images: [String],
    name: String,
    price: Number,
    size: String,
    sizes: [String],
    description: String,
    video: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Product", productSchema);