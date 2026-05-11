require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    if (!options || !options.email) {
      throw new Error("Recipient email is required");
    }

    // Check for real credentials
    const isConfigured = process.env.EMAIL_USER && 
                         process.env.EMAIL_PASS && 
                         process.env.EMAIL_PASS.length > 5; // Basic check for real pass

    if (!isConfigured) {
      const otp = options.html?.match(/\d{6}/)?.[0] || "N/A";
      console.log("\n⚠️ [EMAIL NOT CONFIGURED] ⚠️");
      console.log(`To: ${options.email}`);
      console.log(`OTP: ${otp}`);
      console.log("Please set valid EMAIL_USER and EMAIL_PASS (App Password) in .env to send real emails.\n");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // clean accidental spaces
      },
      family: 4, // bypass IPv6 issues on some cloud providers
      connectionTimeout: 10000,
    });

    const mailOptions = {
      from: `"BANGER SIDE Support" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject || "No Subject",
      text: options.message || "",
      html: options.html || "",
    };

    // ✅ Extract OTP for logging
    const otp =
      options.html?.match(/\d{6}/)?.[0] ||
      options.message?.match(/\d{6}/)?.[0] ||
      "N/A";

    console.log("--------------------------------------------------");
    console.log(`📤 Sending Email`);
    console.log(`📩 To: ${options.email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log("--------------------------------------------------");

    // ✅ Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error(error.message);
  }
};

module.exports = sendEmail;