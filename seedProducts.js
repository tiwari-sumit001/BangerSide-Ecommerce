const mongoose = require("mongoose");
const productModel = require("./models/product-model");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scatch")
    .then(() => console.log("Connected for final enrichment..."))
    .catch(err => console.log(err));

const products = [
    { name: "Eclipse Black Suit", price: 5500, discount: 500, category: "Formal", gender: "Men", description: "Tailored fit for premium events." },
    { name: "Neon Sprint Tee", price: 999, discount: 50, category: "Gym", gender: "Men", description: "Ultra-lightweight fabric." },
    { name: "Urban Dusk Hoodie", price: 2999, discount: 300, category: "Streetwear", gender: "Unisex", description: "Heavyweight fleece." },
    { name: "Rose Gold Gown", price: 7999, discount: 1000, category: "Party", gender: "Women", description: "Sparkle in every step." },
    { name: "Sage Cargo Pants", price: 2499, discount: 200, category: "Streetwear", gender: "Men", description: "Functional and stylish." },
    { name: "Linen Summer Shirt", price: 1899, discount: 150, category: "Casual", gender: "Men", description: "Breathable linen blend." },
    { name: "Azure Yoga Set", price: 3299, discount: 400, category: "Gym", gender: "Women", description: "High-stretch performance wear." },
    { name: "Velvet Party Blazer", price: 6500, discount: 600, category: "Party", gender: "Men", description: "Soft velvet texture for gala nights." }
];

async function seed() {
    await productModel.deleteMany({}); // CLEAR EVERYTHING
    console.log("Cleared old data.");
    
    // Add default styles
    const enriched = products.map(p => ({
        ...p,
        bgcolor: "#" + Math.floor(Math.random()*16777215).toString(16),
        panelcolor: "#333333",
        textcolor: "#ffffff",
        quantity: 50,
        sizes: ["S", "M", "L", "XL"]
    }));

    await productModel.insertMany(enriched);
    console.log("Seeded 8 high-quality unique products!");
    process.exit();
}

seed();
