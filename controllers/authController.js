const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { generateToken } = require("../utils/generateToken");
const sendEmail = require("../utils/emailSender");
const sendSMS = require("../utils/smsSender");

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

module.exports.registerUser = async function (req, res) {
  try {
    let { email, password, fullname, contact } = req.body;

    email = email && email.trim().toLowerCase();
    fullname = fullname && fullname.trim();
    contact = contact && contact.trim();

    if (!fullname || !email || !password || !contact) {
      req.flash("error", "All fields including contact are required");
      return res.redirect("/");
    }

    const existingUser = await userModel.findOne({ $or: [{ email }, { contact }] });

    if (existingUser) {
      if (!existingUser.isVerified) {
        req.flash("error", "Please verify your account. An OTP was sent previously.");
        return res.redirect(`/users/verify?email=${encodeURIComponent(existingUser.email)}`);
      }
      req.flash("error", "User already exists with this email or contact.");
      return res.redirect("/");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await userModel.create({
      email,
      contact,
      password: hashedPassword,
      fullname,
      isVerified: false,
      otp,
      otpExpires
    });

    const otpMessage = `Your BANGER SIDE verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

    // Send OTP via Email
    await sendEmail({
      email: user.email,
      subject: "Verify your BANGER SIDE Account",
      message: otpMessage,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#2563eb">Welcome to BANGER SIDE! 🔥</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="letter-spacing:8px;color:#1a202c;background:#f3f4f6;padding:16px;border-radius:8px;text-align:center">${otp}</h1>
          <p style="color:#6b7280;font-size:13px">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>`
    });

    // Send OTP via SMS (Real Twilio if configured, mock otherwise)
    await sendSMS({
      to: user.contact,
      message: otpMessage,
    });

    req.flash("success", "Registration successful! OTP sent to your Email & Phone.");
    return res.redirect(`/users/verify?email=${encodeURIComponent(email)}`);
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/");
  }
};

module.exports.loginUser = async function (req, res) {
  try {
    let { email, password } = req.body;

    email = email && email.trim().toLowerCase();

    if (!email || !password) {
      req.flash("error", "Email and password are required");
      return res.redirect("/");
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/");
    }

    if (user.isVerified === false) {
      // If strictly false (unverified), resend new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      
      await sendEmail({
        email: user.email,
        subject: "Verify your BANGER SIDE Account",
        message: `Your verification code is ${otp}.`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p>`
      });

      req.flash("error", "Please verify your email first. A new OTP has been sent.");
      return res.redirect(`/users/verify?email=${encodeURIComponent(email)}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/");
    }

    const token = generateToken({
      email: user.email,
      id: user._id,
      role: "user",
      fullname: user.fullname,
    });

    res.cookie("token", token, buildCookieOptions());
    return res.redirect("/shop");
  } catch (err) {
    req.flash("error", "Unable to login right now");
    return res.redirect("/");
  }
};

module.exports.logout = function (req, res) {
  res.clearCookie("token");
  return res.redirect("/");
};

module.exports.verifyOtp = async function (req, res) {
  try {
    let { email, otp } = req.body;
    email = email && email.trim().toLowerCase();

    const user = await userModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    if (user.isVerified) {
      req.flash("error", "User is already verified. Please login.");
      return res.redirect("/");
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      req.flash("error", "Invalid or expired OTP.");
      return res.redirect(`/users/verify?email=${encodeURIComponent(email)}`);
    }

    // OTP is valid
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Login user automatically
    const token = generateToken({
      email: user.email,
      id: user._id,
      role: "user",
      fullname: user.fullname,
    });

    res.cookie("token", token, buildCookieOptions());
    req.flash("success", "Email verified successfully!");
    return res.redirect("/shop");

  } catch (err) {
    req.flash("error", "Something went wrong.");
    return res.redirect("/");
  }
};

module.exports.resendOtp = async function (req, res) {
  try {
    let { email } = req.body;
    email = email && email.trim().toLowerCase();

    const user = await userModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    if (user.isVerified) {
      req.flash("error", "User is already verified.");
      return res.redirect("/");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Your New OTP Code",
      message: `Your new verification code is ${otp}.`,
      html: `<p>Your new verification code is: <strong>${otp}</strong></p>`
    });

    req.flash("success", "A new OTP has been sent to your email.");
    return res.redirect(`/users/verify?email=${encodeURIComponent(email)}`);
  } catch (err) {
    req.flash("error", "Could not resend OTP. Try again later.");
    return res.redirect("/");
  }
};

module.exports.loginOtpRequest = async function (req, res) {
  try {
    let { contact } = req.body;
    contact = contact && contact.trim();

    if (!contact) {
      req.flash("error", "Contact number is required");
      return res.redirect("/");
    }

    let user = await userModel.findOne({ contact });

    if (!user) {
      // Create minimal user if not exists
      user = await userModel.create({
        contact,
        fullname: "Customer", // Placeholder, will update at checkout
        isVerified: false
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const otpMessage = `Your BANGER SIDE login OTP is: ${otp}. Valid for 10 minutes. Do not share.`;

    // Send OTP via SMS (Real Twilio)
    await sendSMS({
      to: contact,
      message: otpMessage,
    });

    // Also send via email if user has one registered
    if (user.email) {
      await sendEmail({
        email: user.email,
        subject: "Your BANGER SIDE Login OTP",
        message: otpMessage,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #eee;border-radius:12px">
            <h2 style="color:#2563eb">BANGER SIDE Login 🔐</h2>
            <p>Your login OTP is:</p>
            <h1 style="letter-spacing:8px;color:#1a202c;background:#f3f4f6;padding:16px;border-radius:8px;text-align:center">${otp}</h1>
            <p style="color:#6b7280;font-size:13px">Valid for 10 minutes. Do not share this code.</p>
          </div>`
      });
    }

    req.flash("success", "OTP sent to your phone number!");
    return res.render("login-otp-verify", { contact, error: req.flash("error") });
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/");
  }
};

module.exports.verifyLoginOtp = async function (req, res) {
  try {
    let { contact, otp } = req.body;
    contact = contact && contact.trim();

    const user = await userModel.findOne({ contact });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      req.flash("error", "Invalid or expired OTP.");
      return res.render("login-otp-verify", { contact, error: req.flash("error") });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken({
      email: user.email || "",
      id: user._id,
      role: "user",
      fullname: user.fullname,
    });

    res.cookie("token", token, buildCookieOptions());
    return res.redirect("/shop");
  } catch (err) {
    req.flash("error", "Login failed");
    return res.redirect("/");
  }
};
