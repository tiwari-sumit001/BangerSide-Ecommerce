const twilio = require("twilio");

/**
 * Sends a real SMS using Twilio if credentials are set in .env
 * Falls back to console.log in development (mock mode)
 *
 * Required .env variables:
 *   TWILIO_ACCOUNT_SID  — from Twilio console
 *   TWILIO_AUTH_TOKEN   — from Twilio console
 *   TWILIO_PHONE_NUMBER — your Twilio number e.g. +15551234567
 */
const sendSMS = async ({ to, message }) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  // Format number: add +91 if not already international
  let formattedTo = to.toString().trim();
  if (!formattedTo.startsWith("+")) {
    formattedTo = "+91" + formattedTo;
  }

  // 🚀 ALWAYS LOG OTP FOR RENDER DASHBOARD (So you don't need real Twilio)
  console.log("------------------------------------------");
  console.log(`🔥 [RENDER SMS OTP] To: ${formattedTo} | Message: ${message}`);
  console.log("------------------------------------------");

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    // ✅ Production — Real SMS via Twilio
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });

    console.log(`[SMS SENT] To: ${formattedTo}`);
  } else {
    // 🔧 Development — Mock mode (print to console)
    console.log(`[MOCK SMS] To: ${formattedTo} | Message: ${message}`);
    console.log(`  → Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env to send real SMS`);
  }
};

module.exports = sendSMS;
