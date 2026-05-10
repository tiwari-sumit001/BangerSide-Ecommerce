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
        const count = await productModel.countDocuments();
        if (count > 5) return res.status(403).send("Database already has products. Use Admin Panel to add more.");

        const seedData = [
            { name: "BANGER Elite Silk Saree", price: 4999, category: "Saree", gender: "Women", quantity: 25, bgcolor: "#ffffff", panelcolor: "#2563eb", textcolor: "#000000", description: "Premium silk saree for elite occasions." },
            { name: "Royal Heritage Sherwani", price: 8999, category: "Sherwani", gender: "Men", quantity: 15, bgcolor: "#ffffff", panelcolor: "#2563eb", textcolor: "#000000", description: "Royal ethnic wear for weddings." },
            { name: "Designer Cotton Kurta", price: 1999, category: "Kurta", gender: "Men", quantity: 40, bgcolor: "#ffffff", panelcolor: "#2563eb", textcolor: "#000000", description: "Comfortable cotton kurta for daily wear." }
        ];

        await productModel.insertMany(seedData);
        res.send("✅ Basic products seeded! Login as Admin to add images and more products.");
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
