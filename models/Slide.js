import mongoose from "mongoose";

const slideSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  btnText: { type: String, default: "" },
  link: { type: String, default: "" },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Slide", slideSchema);
