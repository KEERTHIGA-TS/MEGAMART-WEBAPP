const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        quantity: Number,
      },
    ],
    address: {
      fullName: String,
      street: String,
      city: String,
      zip: String,
      phone: String,
    },
    paymentMethod: {
    type: String,
    enum: ["COD", "Online"],
    default: "COD"
    },
    totalAmount: Number,
    status: {
      type: String,
      default: "Pending",
    },
    placedAt: Date,
    cancelledAt: Date, // ✅ Add this
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
