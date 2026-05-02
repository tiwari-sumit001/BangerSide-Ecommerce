const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const ownerModel = require("../models/owner-model");
const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");
const couponModel = require("../models/coupon-model");
const isOwnerLoggedIn = require("../middlewares/isOwnerLoggedIn");
const { generateToken } = require("../utils/generateToken");
const { decorateOrder } = require("../utils/orderPresentation");

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

if (process.env.NODE_ENV === "development") {
  router.post("/create", async function (req, res) {
    const owners = await ownerModel.find();

    if (owners.length > 0) {
      return res
        .status(503)
        .send("You don't have permission to create a new owner.");
    }

    let { fullname, email, password } = req.body;
    email = email && email.trim().toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdOwner = await ownerModel.create({
      fullname,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      id: createdOwner._id,
      email: createdOwner.email,
      fullname: createdOwner.fullname,
    });
  });
}

router.get("/login", function (req, res) {
  const error = req.flash("error");
  res.render("owner-login", { error });
});


router.post("/login", async function (req, res) {

  const { email, password } = req.body;

  const owner = await ownerModel.findOne({
    email: email.trim()
  });

  if (!owner) {
    req.flash("error", "Invalid owner credentials");
    return res.redirect("/owners/login");
  }

  const isPasswordValid = await bcrypt.compare(password, owner.password);

  if (!isPasswordValid) {
    req.flash("error", "Invalid owner credentials");
    return res.redirect("/owners/login");
  }

  // ✅ SUCCESS
  const token = generateToken({
    id: owner._id,
    role: "owner",
    fullname: owner.fullname,
  });

  res.cookie("token", token, buildCookieOptions());

  return res.redirect("/owners/admin");

});  
router.get("/logout", function (req, res) {
  res.clearCookie("token");
  return res.redirect("/owners/login");
});

router.get("/admin", isOwnerLoggedIn, function (req, res) {
  const success = req.flash("success");
  const error = req.flash("error");
  res.render("createproducts", { success, error });
});

router.get("/dashboard", isOwnerLoggedIn, async function (req, res) {
  const [owner, products, orders] = await Promise.all([
    ownerModel.findById(req.owner.id),
    productModel.find(),
    orderModel.find().sort({ createdAt: -1 }),
  ]);

  const totalRevenue = orders
    .filter((order) => order.orderStatus !== "cancelled")
    .reduce((sum, order) => sum + Number(order.pricing?.finalAmount || 0), 0);

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
    return acc;
  }, {});

  return res.render("owner-dashboard", {
    owner,
    stats: {
      productCount: products.length,
      totalOrders: orders.length,
      totalRevenue,
      placedOrders: statusCounts.placed || 0,
      packedOrders: statusCounts.packed || 0,
      shippedOrders: statusCounts.shipped || 0,
      deliveredOrders: statusCounts.delivered || 0,
      cancelledOrders: statusCounts.cancelled || 0,
    },
    recentOrders: orders.slice(0, 5).map(decorateOrder),
  });
});

router.get("/products", isOwnerLoggedIn, async function (req, res) {
  const products = await productModel.find().sort({ createdAt: -1 });

  return res.render("owner-products", {
    products,
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.get("/products/:productid/edit", isOwnerLoggedIn, async function (req, res) {
  const selectedProduct = await productModel.findById(req.params.productid);

  if (!selectedProduct) {
    req.flash("error", "Product not found");
    return res.redirect("/owners/products");
  }

  return res.render("edit-product", {
    product: selectedProduct,
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.get("/orders", isOwnerLoggedIn, async function (req, res) {
  const orders = await orderModel.find().sort({ createdAt: -1 });

  return res.render("owner-orders", {
    orders: orders.map(decorateOrder),
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.get("/orders/:orderid", isOwnerLoggedIn, async function (req, res) {
  const order = await orderModel.findById(req.params.orderid);

  if (!order) {
    req.flash("error", "Order not found");
    return res.redirect("/owners/orders");
  }

  return res.render("owner-order-details", {
    order: decorateOrder(order),
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.post("/orders/:orderid/status", isOwnerLoggedIn, async function (req, res) {
  const { orderStatus } = req.body;
  const allowedStatuses = ["placed", "packed", "shipped", "delivered", "cancelled"];

  if (!allowedStatuses.includes(orderStatus)) {
    req.flash("error", "Invalid order status");
    return res.redirect("/owners/orders");
  }

  const order = await orderModel.findById(req.params.orderid);

  if (!order) {
    req.flash("error", "Order not found");
    return res.redirect("/owners/orders");
  }

  if (order.orderStatus === "cancelled" || order.orderStatus === "delivered") {
    req.flash("error", "This order can no longer be updated");
    return res.redirect("/owners/orders");
  }

  order.orderStatus = orderStatus;

  if (orderStatus === "delivered" && order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }

  await order.save();

  req.flash("success", "Order status updated successfully");
  return res.redirect("/owners/orders");
});

router.get("/coupons", isOwnerLoggedIn, async function (req, res) {
  const coupons = await couponModel.find().sort({ createdAt: -1 });
  res.render("owner-coupons", {
    coupons,
    success: req.flash("success"),
    error: req.flash("error")
  });
});

router.post("/coupons/create", isOwnerLoggedIn, async function (req, res) {
  try {
    const { code, discount, expiryDate } = req.body;
    await couponModel.create({
      code: code.trim().toUpperCase(),
      discount: Number(discount),
      expiryDate: new Date(expiryDate)
    });
    req.flash("success", "Coupon created successfully!");
    res.redirect("/owners/coupons");
  } catch (err) {
    req.flash("error", "Error creating coupon: " + err.message);
    res.redirect("/owners/coupons");
  }
});

module.exports = router;
