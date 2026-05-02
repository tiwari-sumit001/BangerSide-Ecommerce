const crypto = require("crypto");

async function createRazorpayOrder({ amount, receipt, notes }) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in the environment");
  }

  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.description || "Failed to create Razorpay order");
  }

  return data;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
};
