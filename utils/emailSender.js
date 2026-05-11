require("dotenv").config();
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // ✅ Validate required fields
    if (!options || !options.email) {
      throw new Error("Recipient email is required");
    }

    let transporter;

    // ✅ REAL EMAIL MODE (Gmail SMTP)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // TLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // remove accidental spaces
        },
        family: 4, // avoid IPv6 issues (Render fix)
        connectionTimeout: 15000,
      });
    } 
    // ✅ MOCK MODE (No credentials → log OTP only)
    else {
      const otp =
        options.html?.match(/\d{6}/)?.[0] ||
        options.message?.match(/\d{6}/)?.[0] ||
        "N/A";

      console.log("--------------------------------------------------");
      console.log(`🔥 [MOCK EMAIL MODE]`);
      console.log(`📩 To: ${options.email}`);
      console.log(`🔐 OTP: ${otp}`);
      console.log(`📝 Subject: ${options.subject || "No Subject"}`);
      console.log("--------------------------------------------------");

      return; // stop execution
    }

    // ✅ Email options
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
