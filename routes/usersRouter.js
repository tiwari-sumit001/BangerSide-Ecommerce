const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logout, verifyOtp, resendOtp } = require("../controllers/authController");
const isLoggedIn = require("../middlewares/isLoggedIn");
const userModel = require("../models/user-model");

router.get("/", function (req, res) {
  res.send("users route is working");
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/login-otp-request", require("../controllers/authController").loginOtpRequest);
router.post("/login-otp-verify", require("../controllers/authController").verifyLoginOtp);
router.get("/logout", logout);

router.get("/verify", (req, res) => {
  res.render("verify-otp", { 
    email: req.query.email, 
    error: req.flash("error"), 
    success: req.flash("success") 
  });
});
router.post("/verify", verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id).select("fullname email createdAt addresses");
  return res.render("profile", { user });
});

module.exports = router;
