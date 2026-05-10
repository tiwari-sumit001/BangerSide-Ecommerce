require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");

const app = express();
app.set("trust proxy", 1); // Required for Railway/Render HTTPS cookies

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/usersRouter");
const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");
const paymentsRouter = require("./routes/paymentsRouter");
const aiRouter = require("./routes/aiRouter");

require("./config/mongoose-connection");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET || "change-me-in-env",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
}));
app.use(flash());

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Global middleware for login status
app.use((req, res, next) => {
    res.locals.loggedin = req.cookies.token ? true : false;
    next();
});

app.use("/", indexRouter);

// 👑 Setup Owner Route (Visit once live: your-url.onrender.com/setup-owner)
app.get("/setup-owner", async (req, res) => {
    try {
        const ownerModel = require("./models/owner-model");
        const owners = await ownerModel.find();
             
        if (owners.length > 0) {
            return res.status(403).send("Owner already exists! Go to /owners/login");
        }

        const bcrypt = require("bcrypt");
        const hashedPassword = await bcrypt.hash("password123", 10); 

        await ownerModel.create({
            fullname: "Sumit Tiwari",
            email: "sumit98765tiwariji@gmail.com", 
            password: hashedPassword,
        });

        res.send("✅ Owner created successfully! Login at /owners/login with password: password123. (Change it immediately in DB or Profile)");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// 🏁 Production Seed Route (Visit: your-url.onrender.com/seed-data)
app.get("/seed-data", async (req, res) => {
    try {
        const productModel = require("./models/product-model");
        
        const seedData = [
            // --- MEN'S COLLECTION ---
            { name: "Men's Classic Slim-Fit Shirt", price: 1599, category: "Formal", gender: "Men", quantity: 50, bgcolor: "#f1f5f9", panelcolor: "#0f172a", textcolor: "#ffffff", description: "Premium cotton formal shirt for a sharp look.", sizes: ["S", "M", "L", "XL"] },
            { name: "Men's Executive Suit Blazer", price: 6999, category: "Formal", gender: "Men", quantity: 10, bgcolor: "#f8fafc", panelcolor: "#1e293b", textcolor: "#ffffff", description: "Sharp tailored blazer for business and formal events.", sizes: ["M", "L", "XL"] },
            { name: "Men's Tactical Cargo Pants", price: 2499, category: "Cargo", gender: "Men", quantity: 30, bgcolor: "#f7fee7", panelcolor: "#365314", textcolor: "#ffffff", description: "Multi-pocket durable cargoes for streetwear utility.", sizes: ["M", "L", "XL"] },
            { name: "Men's Tech-Fleece Joggers", price: 1999, category: "Joggers", gender: "Men", quantity: 40, bgcolor: "#fafaf9", panelcolor: "#44403c", textcolor: "#ffffff", description: "Breathable tech-fleece joggers for the ultimate comfort.", sizes: ["S", "M", "L"] },
            { name: "Men's Raw Indigo Jeans", price: 2999, category: "Jeans", gender: "Men", quantity: 35, bgcolor: "#eff6ff", panelcolor: "#1e3a8a", textcolor: "#ffffff", description: "Premium indigo denim with a modern slim-fit cut.", sizes: ["M", "L", "XL"] },
            { name: "Men's Oversized Vibe Tee", price: 999, category: "T-shirt", gender: "Men", quantity: 100, bgcolor: "#f8fafc", panelcolor: "#334155", textcolor: "#ffffff", description: "Heavyweight oversized graphic tee for a relaxed street look.", sizes: ["S", "M", "L", "XL", "XXL"] },
            { name: "Men's Linen Summer Shirt", price: 1799, category: "Summer", gender: "Men", quantity: 45, bgcolor: "#fffbeb", panelcolor: "#92400e", textcolor: "#ffffff", description: "Lightweight linen shirt perfect for beach days and heat.", sizes: ["M", "L", "XL"] },
            { name: "Men's Heavyweight Hoodie", price: 3499, category: "Hoodies", gender: "Men", quantity: 20, bgcolor: "#f3f4f6", panelcolor: "#111827", textcolor: "#ffffff", description: "400GSM cotton hoodie built for the cold vibes.", sizes: ["M", "L", "XL"] },
            { name: "Men's Club Night Blazer", price: 5999, category: "Party", gender: "Men", quantity: 12, bgcolor: "#000000", panelcolor: "#1e1b4b", textcolor: "#ffffff", description: "Sleek velvet blazer designed for elite nightlife.", sizes: ["M", "L"] },
            { name: "Men's Pro-Dry Gym Tee", price: 1299, category: "Gym", gender: "Men", quantity: 60, bgcolor: "#f0fdfa", panelcolor: "#134e4a", textcolor: "#ffffff", description: "Sweat-wicking gym tee for high performance.", sizes: ["S", "M", "L", "XL"] },

            // --- WOMEN'S COLLECTION ---
            { name: "Women's Elite Satin Shirt", price: 1899, category: "Formal", gender: "Women", quantity: 40, bgcolor: "#fdf4ff", panelcolor: "#701a75", textcolor: "#ffffff", description: "Elegant satin shirt for professional and formal settings.", sizes: ["XS", "S", "M", "L"] },
            { name: "Women's High-Rise Cargo", price: 2299, category: "Cargo", gender: "Women", quantity: 25, bgcolor: "#f0fdf4", panelcolor: "#166534", textcolor: "#ffffff", description: "Stylish high-rise cargo pants with a modern utility fit.", sizes: ["S", "M", "L"] },
            { name: "Women's Relaxed Joggers", price: 1599, category: "Joggers", gender: "Women", quantity: 30, bgcolor: "#f9fafb", panelcolor: "#374151", textcolor: "#ffffff", description: "Ultra-soft joggers for lounging or light workouts.", sizes: ["S", "M", "L"] },
            { name: "Women's Distressed Skinny Jeans", price: 2799, category: "Jeans", gender: "Women", quantity: 30, bgcolor: "#f0f9ff", panelcolor: "#075985", textcolor: "#ffffff", description: "Classic distressed skinny jeans with premium stretch.", sizes: ["S", "M", "L"] },
            { name: "Women's Cropped Graphic Tee", price: 899, category: "T-shirt", gender: "Women", quantity: 80, bgcolor: "#fff1f2", panelcolor: "#9f1239", textcolor: "#ffffff", description: "Trendy cropped tee with high-quality graphic print.", sizes: ["XS", "S", "M"] },
            { name: "Women's Sunkissed Maxi Dress", price: 3499, category: "Summer", gender: "Women", quantity: 20, bgcolor: "#fff7ed", panelcolor: "#c2410c", textcolor: "#ffffff", description: "Breezy maxi dress for those golden hour summer moments.", sizes: ["S", "M", "L"] },
            { name: "Women's Pastel Oversized Hoodie", price: 3299, category: "Hoodies", gender: "Women", quantity: 20, bgcolor: "#f5f3ff", panelcolor: "#5b21b6", textcolor: "#ffffff", description: "Cozy oversized hoodie in soft pastel shades.", sizes: ["S", "M", "L"] },
            { name: "Women's Sequined Party Dress", price: 4599, category: "Party", gender: "Women", quantity: 15, bgcolor: "#000000", panelcolor: "#be123c", textcolor: "#ffffff", description: "Dazzling sequin dress for cocktail nights and parties.", sizes: ["XS", "S", "M"] },
            { name: "Women's Pro-Gym Leggings", price: 1999, category: "Gym", gender: "Women", quantity: 40, bgcolor: "#fdf2f8", panelcolor: "#9d174d", textcolor: "#ffffff", description: "Squat-proof compression leggings for the elite athlete.", sizes: ["S", "M", "L"] },
            { name: "Women's Classic Sunkissed Top", price: 1299, category: "Summer", gender: "Women", quantity: 50, bgcolor: "#fffaf0", panelcolor: "#d97706", textcolor: "#ffffff", description: "Light and airy top for bright sunny days.", sizes: ["XS", "S", "M"] },

            // --- UNISEX / CLASSIC ---
            { name: "BANGER Classic Tote Bag", price: 499, category: "Accessories", gender: "Unisex", quantity: 200, bgcolor: "#ffffff", panelcolor: "#000000", textcolor: "#ffffff", description: "Minimalist canvas tote for your daily essentials.", sizes: ["FREE"] },
            { name: "Signature BANGER Cap", price: 799, category: "Accessories", gender: "Unisex", quantity: 150, bgcolor: "#fafafa", panelcolor: "#18181b", textcolor: "#ffffff", description: "Adjustable signature cap with high-quality embroidery.", sizes: ["FREE"] }
        ];

        // Clear only placeholder items (no images) to avoid cluttering real products
        await productModel.deleteMany({ images: { $size: 0 } }); 
        
        await productModel.insertMany(seedData);
        res.send(`✅ Success! Added ${seedData.length} premium boxes for Men & Women across all categories. Visit Admin Panel to add images!`);
    } catch (err) {
        res.status(500).send("Seed Error: " + err.message);
    }
});

app.use("/users", usersRouter);
app.use("/owners", ownersRouter);
app.use("/products", productsRouter);
app.use("/payments", paymentsRouter);
app.use("/ai", aiRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is officially running on port ${port}`);
});


app.use(function (req, res) {
  res.status(404).render("not-found");
});

app.use(function (err, req, res, next) {
  console.error("🔥 Server Error:", err.message);
  res.status(500).render("server-error");
});
