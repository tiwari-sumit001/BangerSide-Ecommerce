const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch";

mongoose
  .connect(mongoUri)
  .then(function () {
    console.log("✅ MongoDB Connected successfully");
  })
  .catch(function (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

module.exports = mongoose.connection;
