import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  pricePerPiece: Number,
  piecesPerBox: Number,
  description: String,
  images: [String],
  category: String,

  formats: [String],
  colors: [String],
  sizes: [String],
  tileUses: [String],
  styles: [String],
  materials: [String],
  looks: [String],
  finishes: [String],
  effects: [String],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Product", productSchema);