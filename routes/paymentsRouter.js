const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const userModel = require("../models/user-model");
const { createApplicationOrder, validateCartForOrder } = require("../utils/checkoutHelpers");
const { createRazorpayOrder, verifyRazorpaySignature } = require("../utils/razorpay");

router.post("/create-order", isLoggedIn, async function (req, res) {
  try {
    const { addressId, paymentMethod } = req.body;

    if (!["upi", "card"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Unsupported online payment method" });
    }

    const user = await userModel
      .findById(req.user.id)
      .populate("cart.product");

    const selectedAddress = user.addresses.id(addressId) ||
      user.addresses.find((address) => address.isDefault);

    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Please select a delivery address" });
    }

    const validation = await validateCartForOrder(user);

    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const totalAmount = validation.items.reduce((sum, item) => {
      return sum + (item.price - item.discount) * item.quantity;
    }, 20);

    const razorpayOrder = await createRazorpayOrder({
      amount: totalAmount * 100,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: String(user._id),
        paymentMethod,
      },
    });

    req.session.pendingCheckout = {
      addressId: String(selectedAddress._id),
      paymentMethod,
      razorpayOrderId: razorpayOrder.id,
    };

    return res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: "BANGER SIDE",
      description: "Order payment",
      prefill: {
        name: user.fullname,
        email: user.email,
        contact: selectedAddress.phone,
      },
    });
  } catch (err) {
    let errorMessage = err.message;
    if (errorMessage.includes("Authentication") || errorMessage.includes("401")) {
        errorMessage = "Razorpay Auth Failed: Please check your RAZORPAY_KEY_ID and SECRET in .env file.";
    }
    return res.status(500).json({ success: false, message: errorMessage });
  }
});

router.post("/verify", isLoggedIn, async function (req, res) {
  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    const pendingCheckout = req.session.pendingCheckout;

    if (!pendingCheckout || pendingCheckout.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: "Payment session expired. Please try again." });
    }

    const isSignatureValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const user = await userModel
      .findById(req.user.id)
      .populate("cart.product");

    const selectedAddress = user.addresses.id(pendingCheckout.addressId);

    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Selected address no longer exists" });
    }

    await createApplicationOrder({
      user,
      address: selectedAddress,
      paymentMethod: pendingCheckout.paymentMethod,
      paymentStatus: "paid",
      paymentGateway: "razorpay",
      paymentGatewayOrderId: razorpayOrderId,
      paymentGatewayPaymentId: razorpayPaymentId,
      paymentGatewaySignature: razorpaySignature,
    });

    delete req.session.pendingCheckout;

    return res.json({ success: true, redirectUrl: "/orders" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
