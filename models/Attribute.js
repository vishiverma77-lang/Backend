import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // "colors" or "shapes"
  values: [{ type: String }]
});

export default mongoose.model("Attribute", attributeSchema);
