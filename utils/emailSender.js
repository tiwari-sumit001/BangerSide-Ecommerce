const nodemailer = require("nodemailer");

// For development, we use Ethereal Email (fake SMTP service).
// If EMAIL_USER and EMAIL_PASS are set in .env, it uses Gmail.
const sendEmail = async (options) => {
  let transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production / Real Email (Gmail)
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 🚀 FORCE IPv4: Cloud providers often have IPv6 issues
      lookup: (hostname, options, callback) => {
        require("dns").lookup(hostname, { family: 4 }, callback);
      },
      tls: {
        rejectUnauthorized: false,
        servername: "smtp.gmail.com"
      },
      debug: true,
      logger: true
    });
  } else {
    // 🔧 FAST MOCK MODE — Just Log to Console
    const extractedOtp = options.html ? (options.html.match(/\d{6}/)?.[0] || 'N/A') : 'N/A';
    console.log("------------------------------------------");
    console.log(`🔥 [RENDER OTP] To: ${options.email || 'Unknown'} | OTP: ${extractedOtp}`);
    console.log("📝 Subject: " + (options.subject || 'No Subject'));
    console.log("------------------------------------------");
    return; // Exit early, don't send real email
  }

  const mailOptions = {
    from: "BANGER SIDE Support <support@bangerside.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 🚀 ALWAYS LOG OTP FOR RENDER DASHBOARD (So you don't need real Gmail)
  const extractedOtpAlt = options.html ? (options.html.match(/\d{6}/)?.[0] || 'N/A') : 'N/A';
  console.log("------------------------------------------");
  console.log(`🔥 [RENDER OTP] To: ${options.email || 'Unknown'} | OTP: ${extractedOtpAlt}`);
  console.log("------------------------------------------");

  const info = await transporter.sendMail(mailOptions);
  
  if (!process.env.EMAIL_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
