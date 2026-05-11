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

    console.log("📩 Registration Attempt:", { email, contact, fullname });

    if (!fullname || !email || !password || !contact) {
      console.log("❌ STEP 0: Missing fields in registration");
      req.flash("error", "All fields including contact are required");
      return res.redirect("/");
    }

    console.log("🔍 STEP 1: Checking existing user in DB...");
    const existingUser = await userModel.findOne({ $or: [{ email }, { contact }] });

    if (existingUser) {
      console.log("⚠️ STEP 1.1: User already exists");
      if (!existingUser.isVerified) {
        // Update details if they changed during re-registration attempt
        existingUser.email = email;
        existingUser.contact = contact;
        existingUser.fullname = fullname;
        existingUser.password = await bcrypt.hash(password, 10);
        
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.otp = newOtp;
        existingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        await existingUser.save();

        const otpMessage = `Your BANGER SIDE verification code is: ${newOtp}. Valid for 10 minutes.`;
        
        try {
          await sendEmail({
            email: existingUser.email,
            subject: "Verify your BANGER SIDE Account",
            message: otpMessage,
            html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #eee;border-radius:12px">
                    <h2 style="color:#2563eb">Account Verification 🔥</h2>
                    <p>Use this OTP to verify your account:</p>
                    <h1 style="letter-spacing:8px;color:#1a202c;background:#f3f4f6;padding:16px;border-radius:8px;text-align:center">${newOtp}</h1>
                  </div>`
          });
        } catch(e) { console.log("Re-reg email fail"); }

        req.flash("success", "Account details updated. A new OTP has been sent to your email.");
        return res.redirect(`/users/verify?email=${encodeURIComponent(existingUser.email)}`);
      }
      req.flash("error", "User already exists with this email or contact.");
      return res.redirect("/");
    }

    console.log("🔐 STEP 2: Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log("💾 STEP 3: Creating user in MongoDB...");
    const user = await userModel.create({
      email,
      contact,
      password: hashedPassword,
      fullname,
      isVerified: false,
      otp,
      otpExpires
    });

    console.log("✅ STEP 3.1: User created successfully. ID:", user._id);

    const otpMessage = `Your BANGER SIDE verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

    // Send OTP via Email
    console.log("📧 STEP 4: Triggering Email OTP...");
    try {
      await sendEmail({
        email: user.email || email,
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
      console.log("📬 STEP 4.1: Email sent successfully");
    } catch (emailErr) {
      console.error("🔥 ERROR in Email Sending:", emailErr.message);
      // We continue even if email fails to try SMS
    }

    // Send OTP via SMS
    console.log("📱 STEP 5: Triggering SMS OTP...");
    try {
      await sendSMS({
        to: user.contact || contact,
        message: otpMessage,
      });
      console.log("📲 STEP 5.1: SMS sent successfully");
    } catch (smsErr) {
      console.error("🔥 ERROR in SMS Sending:", smsErr.message);
    }

    req.flash("success", "Registration successful! OTP sent to your Email & Phone.");
    
    const finalIdentifier = (user && user.email) || email || (user && user.contact) || contact || "user";
    console.log(`🏁 STEP 6: Redirecting to verify: ${finalIdentifier}`);
    
    return res.redirect(`/users/verify?email=${encodeURIComponent(finalIdentifier)}`);
  } catch (err) {
    console.error("💥 CRITICAL ERROR in Register Flow:", err);
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
      const loginIdentifier = user.email || user.contact || "user";
      return res.redirect(`/users/verify?email=${encodeURIComponent(loginIdentifier)}`);
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
    const resendIdentifier = email || (user && user.contact) || "user";
    return res.redirect(`/users/verify?email=${encodeURIComponent(resendIdentifier)}`);
  } catch (err) {
    req.flash("error", "Could not resend OTP. Try again later.");
    return res.redirect("/");
  }
};

module.exports.loginOtpRequest = async function (req, res) {
  try {
    let { contact } = req.body; // 'contact' is the field name from the form
    const identifier = contact && contact.trim().toLowerCase();

    if (!identifier) {
      req.flash("error", "Email or Phone Number is required");
      return res.redirect("/");
    }

    const isEmail = identifier.includes("@");
    let user;

    if (isEmail) {
      user = await userModel.findOne({ email: identifier });
    } else {
      user = await userModel.findOne({ contact: identifier });
    }

    if (!user) {
      // Create a new user if they don't exist
      const userData = {
        fullname: "Banger User", // Default name
        isVerified: false
      };
      if (isEmail) userData.email = identifier;
      else userData.contact = identifier;

      user = await userModel.create(userData);
      console.log(`✨ New user created via OTP: ${identifier}`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const otpMessage = `Your BANGER SIDE verification code is: ${otp}. Valid for 10 minutes.`;

    if (isEmail || user.email) {
      await sendEmail({
        email: user.email || (isEmail ? identifier : null),
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

    if (!isEmail) {
      try {
        await sendSMS({
          to: identifier,
          message: otpMessage,
        });
      } catch (smsErr) {
        console.error("SMS failed, but email might have been sent if user has one.");
      }
    }

    req.flash("success", `OTP sent to your ${isEmail ? 'email' : 'phone'}!`);
    return res.render("login-otp-verify", { contact: identifier, error: req.flash("error") });
  } catch (err) {
    console.error("OTP Request Error:", err);
    req.flash("error", err.message);
    return res.redirect("/");
  }
};

module.exports.verifyLoginOtp = async function (req, res) {
  try {
    let { contact, otp } = req.body;
    const identifier = contact && contact.trim().toLowerCase();

    if (!identifier || !otp) {
      req.flash("error", "Identifier and OTP are required");
      return res.redirect("/");
    }

    const isEmail = identifier.includes("@");
    let user;

    if (isEmail) {
      user = await userModel.findOne({ email: identifier });
    } else {
      user = await userModel.findOne({ contact: identifier });
    }

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      req.flash("error", "Invalid or expired OTP.");
      return res.render("login-otp-verify", { contact: identifier, error: req.flash("error") });
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
