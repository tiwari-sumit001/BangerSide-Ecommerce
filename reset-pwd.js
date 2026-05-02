require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ownerModel = require('./models/owner-model');

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch")
.then(async () => {
    console.log("✅ MongoDB Connected");

    const newPassword = await bcrypt.hash("12345", 10);

    const result = await ownerModel.updateMany({}, {
        password: newPassword
    });

    console.log("Updated passwords for", result.modifiedCount, "owner(s).");

    process.exit(0);
})
.catch(err => {
    console.error("❌ Error connecting or updating:", err);
    process.exit(1);
});