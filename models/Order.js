import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      paymentMethod: { type: String, default: "COD" },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        selectedSize: { type: String },
        selectedColor: { type: String },
        quantity: { type: Number, required: true },
        pricePerBox: { type: Number, required: true },
        isSample: { type: Boolean, default: false },
      },
    ],
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    adminNote: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paymentStatus: { type: String, default: "Pending" }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
