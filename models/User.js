import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ""
  },
  lastName: {
    type: String,
    default: ""
  },
  zipCode: {
    type: String,
    default: ""
  },
  state: {
    type: String,
    default: ""
  },
  profession: {
    type: String,
    default: ""
  },
  jobTitle: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  accountType: {
    type: String,
    default: "Customer"
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "user"
  },
  lastLogin: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  lastLoginLocation: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);
