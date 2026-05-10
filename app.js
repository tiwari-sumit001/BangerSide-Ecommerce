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
            // --- NEW GYM SPECIAL COLLECTION ---
            { name: "Men's Pro-Compression Long Sleeve", price: 1499, category: "Gym", gender: "Men", quantity: 50, bgcolor: "#f0fdfa", panelcolor: "#134e4a", textcolor: "#ffffff", description: "Ultra-tight second-skin fit for peak performance.", sizes: ["S", "M", "L", "XL"] },
            { name: "Women's Elite Sculpt Compression Set", price: 2999, category: "Gym", gender: "Women", quantity: 30, bgcolor: "#fdf2f8", panelcolor: "#9d174d", textcolor: "#ffffff", description: "Premium seamless compression for high-intensity training.", sizes: ["XS", "S", "M"] },
            { name: "Men's 'Pump Cover' Oversized Gym Tee", price: 1199, category: "Gym", gender: "Men", quantity: 100, bgcolor: "#f8fafc", panelcolor: "#0f172a", textcolor: "#ffffff", description: "Heavyweight cotton pump cover with a perfect drop shoulder.", sizes: ["M", "L", "XL", "XXL"] },
            { name: "Women's 'Strong' Oversized Gym Tee", price: 1099, category: "Gym", gender: "Women", quantity: 80, bgcolor: "#fafaf9", panelcolor: "#44403c", textcolor: "#ffffff", description: "Soft, breathable oversized fit for a confident workout.", sizes: ["S", "M", "L"] },
            { name: "Unisex Pro-Grip Gym Gloves", price: 599, category: "Accessories", gender: "Unisex", quantity: 200, bgcolor: "#ffffff", panelcolor: "#000000", textcolor: "#ffffff", description: "Elite grip support for heavy lifting sessions.", sizes: ["FREE"] },

            // --- RE-SEEDING OTHER CATEGORIES (IF EMPTY) ---
            { name: "Men's Classic Slim-Fit Shirt", price: 1599, category: "Formal", gender: "Men", quantity: 50, bgcolor: "#f1f5f9", panelcolor: "#0f172a", textcolor: "#ffffff", description: "Premium cotton formal shirt.", sizes: ["S", "M", "L", "XL"] },
            { name: "Women's Elite Satin Shirt", price: 1899, category: "Formal", gender: "Women", quantity: 40, bgcolor: "#fdf4ff", panelcolor: "#701a75", textcolor: "#ffffff", description: "Elegant satin for formal events.", sizes: ["XS", "S", "M", "L"] }
        ];

        // IMPORTANT: Only delete items that HAVE NO IMAGES
        // This protects the products the user has already customized
        await productModel.deleteMany({ 
            images: { $size: 0 },
            image: { $exists: false } 
        }); 
        
        await productModel.insertMany(seedData);
        res.send(`✅ Success! Added ${seedData.length} new Gym & Elite boxes. Your existing customized products are safe.`);
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
