const mongoose = require("mongoose");

const ownerSchema = mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    minLength: 3,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  products: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
    ],
    default: [],
  },
  picture: String,
  gstin: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model("owner", ownerSchema);
