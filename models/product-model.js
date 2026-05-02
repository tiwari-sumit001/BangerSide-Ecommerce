const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  images: {
    type: [Buffer],
    default: [],
  },
  image: Buffer, // Keeping for compatibility with existing data
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
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
    default: 0,
    min: 0,
  },
  category: {
    type: String,
    default: "General",
    trim: true,
  },
  sizes: {
    type: [String],
    default: ["S", "M", "L", "XL"],
  },
  gender: {
    type: String,
    enum: ["Men", "Women", "Unisex"],
    default: "Unisex",
  },
  bgcolor: {
    type: String,
    default: "#f3f4f6",
  },
  panelcolor: {
    type: String,
    default: "#1f2937",
  },
  textcolor: {
    type: String,
    default: "#ffffff",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("product", productSchema);
