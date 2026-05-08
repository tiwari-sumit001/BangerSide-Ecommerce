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

app.use("/", indexRouter);

// 👑 Setup Owner Route (Live hone par ek baar run karein: your-url.up.railway.app/setup-owner)
app.get("/setup-owner", async (req, res) => {
    try {
        const ownerModel = require("./models/owner-model");
        let owners = await ownerModel.find();
             
        if (owners.length > 0) {
            return res.status(403).send("Owner already exists! Go to /owners/login");
        }

        const bcrypt = require("bcrypt");
        const hashedPassword = await bcrypt.hash("password123", 10); // Default password

        let createdOwner = await ownerModel.create({
            fullname: "Sumit Tiwari",
            email: "sumit98765tiwariji@gmail.com", 
            password: hashedPassword,
        });

        res.send("✅ Owner created successfully! Login with password: password123 at /owners/login. IMPORTANT: Change password immediately!");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is officially running on port ${port}`);
});

app.use("/users", usersRouter);
app.use("/owners", ownersRouter);
app.use("/products", productsRouter);
app.use("/payments", paymentsRouter);
app.use("/ai", aiRouter);

app.use(function (req, res) {
  res.status(404).render("not-found");
});

app.use(function (err, req, res, next) {
  console.error("🔥 Server Error:", err.message);
  res.status(500).render("server-error");
});







