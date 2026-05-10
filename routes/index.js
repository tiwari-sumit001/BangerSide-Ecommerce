const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");
const couponModel = require("../models/coupon-model");
const { buildCartSummary, createApplicationOrder } = require("../utils/checkoutHelpers");
const { decorateOrder } = require("../utils/orderPresentation");

function getCartProductId(item) {
  if (!item) {
    return null;
  }

  if (item.product) {
    return item.product._id ? item.product._id.toString() : item.product.toString();
  }

  return item._id ? item._id.toString() : item.toString();
}

function normalizeLegacyCart(user) {
  let changed = false;

  user.cart = user.cart
    .filter(Boolean)
    .map((item) => {
      if (item.product) {
        return item;
      }

      changed = true;
      return {
        product: item._id || item,
        quantity: 1,
      };
    });

  return changed;
}

router.get("/", function (req, res) {
  const error = req.flash("error");
  res.render("index", { error, loggedin: false });
});

router.get("/shop", async (req, res) => {
  const { search, category, minPrice, maxPrice, gender, size, sort } = req.query;

  const query = {};

  if (search) query.name = { $regex: search.trim(), $options: "i" };
  if (category) query.category = category;
  if (gender) query.gender = gender;
  if (size) query.sizes = { $in: [size] };
  
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let sortQuery = { createdAt: -1 };
  if (sort === "low-to-high") sortQuery = { price: 1 };
  if (sort === "high-to-low") sortQuery = { price: -1 };

  const products = await productModel.find(query).sort(sortQuery);
  const categories = await productModel.distinct("category");

  res.render("shop", {
    products,
    categories,
    filters: {
      search: search || "",
      category: category || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      gender: gender || "",
      size: size || "",
      sort: sort || "newest"
    },
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.get("/addtocart/:productid", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  const product = await productModel.findById(req.params.productid);

  const cartWasNormalized = normalizeLegacyCart(user);

  if (!product) {
    req.flash("error", "Product not found");
    return res.redirect("/shop");
  }

  if (product.quantity <= 0) {
    req.flash("error", "This product is currently out of stock");
    return res.redirect("/shop");
  }

  const size = req.query.size;
  if (!size) {
    console.log(`⚠️ AddToCart Failed: Size missing for Product ${req.params.productid}`);
    req.flash("error", "Please select a size first");
    const referer = req.headers.referer || "/shop";
    return res.redirect(referer);
  }

  const existingCartItem = user.cart.find((item) => {
    return getCartProductId(item) === req.params.productid && item.size === size;
  });

  const requestedQuantity = existingCartItem ? existingCartItem.quantity + 1 : 1;

  if (requestedQuantity > product.quantity) {
    req.flash("error", "You cannot add more than the available stock");
    return res.redirect("/cart");
  }

  if (existingCartItem) {
    existingCartItem.quantity += 1;
  } else {
    user.cart.push({
      product: req.params.productid,
      quantity: 1,
      size: size,
    });
  }

  await user.save();

  req.flash("success", "Added to cart");
  return res.redirect("/cart");
});

router.get("/cart", isLoggedIn, async function (req, res) {
  let user = await userModel.findById(req.user.id);

  const cartWasNormalized = normalizeLegacyCart(user);

  if (cartWasNormalized) {
    await user.save();
  }

  user = await userModel
    .findById(req.user.id)
    .populate("cart.product");

  const summary = buildCartSummary(user);

  res.render("cart", {
    user,
    ...summary,
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

router.get("/cart/increase/:productid", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  const product = await productModel.findById(req.params.productid);
  const cartWasNormalized = normalizeLegacyCart(user);
  const cartItem = user.cart.find((item) => getCartProductId(item) === req.params.productid);

  if (cartItem && product) {
    if (cartItem.quantity >= product.quantity) {
      req.flash("error", "Maximum available stock already added");
      return res.redirect("/cart");
    }

    cartItem.quantity += 1;
  }

  if (cartWasNormalized || cartItem) {
    await user.save();
  }

  return res.redirect("/cart");
});

router.get("/cart/decrease/:productid", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  const cartWasNormalized = normalizeLegacyCart(user);
  const cartItem = user.cart.find((item) => getCartProductId(item) === req.params.productid);

  if (cartItem) {
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
    } else {
      user.cart = user.cart.filter((item) => getCartProductId(item) !== req.params.productid);
    }
  }

  if (cartWasNormalized || cartItem) {
    await user.save();
  }

  return res.redirect("/cart");
});

router.get("/cart/remove/:productid", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  user.cart = user.cart.filter((item) => getCartProductId(item) !== req.params.productid);
  await user.save();
  req.flash("success", "Item removed from cart");
  return res.redirect("/cart");
});

router.get("/cart/empty", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  user.cart = [];
  await user.save();
  req.flash("success", "Cart emptied successfully");
  return res.redirect("/cart");
});

router.get("/wishlist", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id).populate("wishlist.product");
  res.render("wishlist", {
    user,
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

router.get("/wishlist/add/:productid", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  const product = await productModel.findById(req.params.productid);
  let size = req.query.size || ""; 

  console.log(`💖 Wishlist Add: Product=${req.params.productid}, Size=${size}`);

  if (!product) {
    req.flash("error", "Product not found");
    return res.redirect("/shop");
  }

  // If size is missing but user clicked wishlist, we can either:
  // 1. Error out (like cart)
  // 2. Or add with empty size and let them select in wishlist?
  // User says they ARE selecting size, so if it's missing here, something is wrong in frontend.

  const isAlreadyInWishlist = user.wishlist.some(item => 
    (item.product && item.product.toString() === req.params.productid)
  );

  if (!isAlreadyInWishlist) {
    user.wishlist.push({
      product: req.params.productid,
      size: size
    });
    await user.save();
    req.flash("success", "Added to wishlist");
  } else {
    // If already in wishlist, maybe update the size?
    const item = user.wishlist.find(i => i.product.toString() === req.params.productid);
    if (item && size) {
        item.size = size;
        await user.save();
        req.flash("success", "Wishlist item updated with selected size");
    } else {
        req.flash("success", "Product is already in your wishlist");
    }
  }

  const referer = req.headers.referer || "/shop";
  return res.redirect(referer);
});

router.get("/wishlist/remove/:productid", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  user.wishlist = user.wishlist.filter(item => {
    const id = item.product ? item.product.toString() : item.toString();
    return id !== req.params.productid;
  });
  await user.save();
  req.flash("success", "Removed from wishlist");
  
  const referer = req.headers.referer || "/wishlist";
  return res.redirect(referer);
});

router.get("/wishlist/empty", isLoggedIn, async function (req, res) {
  const user = await userModel.findById(req.user.id);
  user.wishlist = [];
  await user.save();
  req.flash("success", "Wishlist emptied");
  return res.redirect("/wishlist");
});

router.post("/validate-coupon", isLoggedIn, async function (req, res) {
  try {
    const { code } = req.body;
    const coupon = await couponModel.findOne({ 
      code: code.trim().toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
    }

    res.json({ success: true, discount: coupon.discount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/addresses", isLoggedIn, async function (req, res) {
  const { fullName, phone, pincode, street, city, state, country, isDefault } = req.body;

  if (!fullName || !phone || !pincode || !street || !city || !state) {
    req.flash("error", "Please fill all required address fields");
    return res.redirect("/checkout");
  }

  const user = await userModel.findById(req.user.id);

  if (isDefault === "on") {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }

  user.addresses.push({
    fullName,
    phone,
    pincode,
    street,
    city,
    state,
    country: country || "India",
    isDefault: isDefault === "on" || user.addresses.length === 0,
  });

  await user.save();
  req.flash("success", "Address added successfully");
  return res.redirect("/checkout");
});

router.get("/checkout", isLoggedIn, async function (req, res) {
  let user = await userModel.findById(req.user.id);

  const cartWasNormalized = normalizeLegacyCart(user);

  if (cartWasNormalized) {
    await user.save();
  }

  user = await userModel
    .findById(req.user.id)
    .populate("cart.product");

  if (!user.cart.length) {
    req.flash("error", "Add products to your cart before checkout");
    return res.redirect("/cart");
  }

  const summary = buildCartSummary(user);

  res.render("checkout", {
    user,
    ...summary,
    razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

router.post("/checkout", isLoggedIn, async function (req, res) {
  try {
    const { addressId, paymentMethod, couponCode } = req.body;

    let user = await userModel.findById(req.user.id);

    const cartWasNormalized = normalizeLegacyCart(user);

    if (cartWasNormalized) {
      await user.save();
    }

    user = await userModel
      .findById(req.user.id)
      .populate("cart.product");

    if (!user.cart.length) {
      req.flash("error", "Your cart is empty");
      return res.redirect("/cart");
    }

    const selectedAddress = user.addresses.id(addressId) ||
      user.addresses.find((address) => address.isDefault);

    if (!selectedAddress) {
      req.flash("error", "Please add a delivery address before placing an order");
      return res.redirect("/checkout");
    }

    if (paymentMethod !== "cod") {
      req.flash("error", "Use the online payment button for UPI or Card payments");
      return res.redirect("/checkout");
    }

    // Server-side Coupon Validation
    let couponDiscountPercent = 0;
    let validCouponCode = null;
    
    if (couponCode) {
      const coupon = await couponModel.findOne({ 
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() }
      });
      if (coupon) {
        validCouponCode = coupon.code;
        couponDiscountPercent = coupon.discount;
      }
    }

    const { order } = await createApplicationOrder({
      user,
      address: selectedAddress,
      paymentMethod: "cod",
      paymentStatus: "pending",
      paymentGateway: "offline",
      couponCode: validCouponCode,
      couponDiscountPercent: couponDiscountPercent,
    });

    return res.redirect(`/orders/success/${order._id}`);
  } catch (err) {
    req.flash("error", err.message || "Failed to place order");
    return res.redirect("/checkout");
  }
});

router.get("/orders/success/:orderid", isLoggedIn, async function (req, res) {
  const order = await orderModel.findOne({
    _id: req.params.orderid,
    user: req.user.id,
  });

  if (!order) {
    req.flash("error", "Order not found");
    return res.redirect("/orders");
  }

  res.render("order-success", { order: decorateOrder(order) });
});

router.get("/orders", isLoggedIn, async function (req, res) {
  const orders = await orderModel.find({ user: req.user.id }).sort({ createdAt: -1 });

  res.render("orders", {
    orders: orders.map(decorateOrder),
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.get("/orders/:orderid", isLoggedIn, async function (req, res) {
  const order = await orderModel.findOne({
    _id: req.params.orderid,
    user: req.user.id,
  });

  if (!order) {
    req.flash("error", "Order not found");
    return res.redirect("/orders");
  }

  return res.render("order-details", {
    order: decorateOrder(order),
  });
});

router.post("/orders/:orderid/cancel", isLoggedIn, async function (req, res) {
  const order = await orderModel.findOne({
    _id: req.params.orderid,
    user: req.user.id,
  });

  if (!order) {
    req.flash("error", "Order not found");
    return res.redirect("/orders");
  }

  if (!["placed", "packed"].includes(order.orderStatus)) {
    req.flash("error", "This order can no longer be cancelled");
    return res.redirect("/orders");
  }

  for (const item of order.items) {
    await productModel.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity },
    });
  }

  order.orderStatus = "cancelled";
  order.paymentStatus = order.paymentMethod === "cod" ? "failed" : order.paymentStatus;
  await order.save();

  req.flash("success", "Order cancelled successfully");
  return res.redirect("/orders");
});

router.get("/logout", function (req, res) {
  res.clearCookie("token");
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Profile Route
router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    res.render("profile", { user, footer: true });
  } catch (err) {
    res.send(err.message);
  }
});

module.exports = router;
