const nodemailer = require("nodemailer");

// For development, we use Ethereal Email (fake SMTP service).
// If EMAIL_USER and EMAIL_PASS are set in .env, it uses Gmail.
const sendEmail = async (options) => {
  let transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production / Real Email (Gmail)
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Development / Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Ethereal test account created: ${testAccount.user}`);
  }

  const mailOptions = {
    from: "BANGER SIDE Support <support@bangerside.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 🚀 ALWAYS LOG OTP FOR RENDER DASHBOARD (So you don't need real Gmail)
  console.log("------------------------------------------");
  console.log(`🔥 [RENDER OTP] To: ${options.email} | OTP: ${options.html.match(/\d{6}/)?.[0] || 'N/A'}`);
  console.log("------------------------------------------");

  const info = await transporter.sendMail(mailOptions);
  
  if (!process.env.EMAIL_USER) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
