import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  contact: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 120 // Automatically delete document after 120 seconds (2 minutes)
  }
});

export default mongoose.model("OTP", otpSchema);
