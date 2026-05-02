const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      size: String,
      image: Buffer,
    },
  ],
  shippingAddress: {
    fullName: String,
    phone: String,
    pincode: String,
    street: String,
    city: String,
    state: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "card", "upi"],
    default: "cod",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentGateway: {
    type: String,
    default: "offline",
  },
  paymentGatewayOrderId: String,
  paymentGatewayPaymentId: String,
  paymentGatewaySignature: String,
  orderStatus: {
    type: String,
    enum: ["placed", "packed", "shipped", "delivered", "cancelled"],
    default: "placed",
  },
  pricing: {
    totalMRP: Number,
    discount: Number,
    platformFee: Number,
    finalAmount: Number,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("order", orderSchema);
