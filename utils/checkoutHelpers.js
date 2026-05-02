const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");

function buildCartSummary(user) {
  let totalMRP = 0;
  let discount = 0;

  const cartItems = user.cart
    .filter((item) => item && item.product)
    .map((item) => {
      const lineMrp = Number(item.product.price) * Number(item.quantity);
      const lineDiscount = Number(item.product.discount || 0) * Number(item.quantity);

      totalMRP += lineMrp;
      discount += lineDiscount;

      return {
        product: item.product,
        productId: item.product && item.product._id ? item.product._id.toString() : "",
        productName: item.product && item.product.name ? item.product.name : "Unnamed Product",
        productCategory: item.product && item.product.category ? item.product.category : "General",
        imageSrc: item.product && item.product.image
          ? `data:image/jpeg;base64,${item.product.image.toString("base64")}`
          : "https://via.placeholder.com/300",
        quantity: item.quantity,
        size: item.size,
        lineTotal: lineMrp - lineDiscount,
      };
    });

  const platformFee = cartItems.length > 0 ? 20 : 0;
  const finalAmount = totalMRP - discount + platformFee;

  return {
    cartItems,
    totalMRP,
    discount,
    platformFee,
    finalAmount,
  };
}

async function validateCartForOrder(user) {
  if (!user.cart.length) {
    return { error: "Your cart is empty" };
  }

  const items = [];

  for (const cartItem of user.cart) {
    if (!cartItem || !cartItem.product) {
      continue;
    }

    const product = await productModel.findById(cartItem.product._id || cartItem.product);

    if (!product) {
      return { error: "One of the products in your cart no longer exists" };
    }

    if (product.quantity < cartItem.quantity) {
      return { error: `${product.name} does not have enough stock for this order` };
    }

    items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      discount: product.discount,
      quantity: cartItem.quantity,
      size: cartItem.size,
      image: product.image,
    });
  }

  if (!items.length) {
    return { error: "Your cart contains invalid items. Please add the product again." };
  }

  return { items };
}

async function createApplicationOrder({
  user,
  address,
  paymentMethod,
  paymentStatus,
  paymentGateway,
  paymentGatewayOrderId,
  paymentGatewayPaymentId,
  paymentGatewaySignature,
  couponCode = null,
  couponDiscountPercent = 0,
}) {
  const validation = await validateCartForOrder(user);

  if (validation.error) {
    throw new Error(validation.error);
  }

  const summary = buildCartSummary(user);
  
  // Calculate coupon discount if applicable
  const couponDiscountAmount = couponCode 
    ? Math.round(summary.finalAmount * (couponDiscountPercent / 100)) 
    : 0;
  
  const actualFinalAmount = summary.finalAmount - couponDiscountAmount;

  for (const cartItem of user.cart) {
    if (!cartItem || !cartItem.product) {
      continue;
    }

    await productModel.findByIdAndUpdate(cartItem.product._id || cartItem.product, {
      $inc: { quantity: -cartItem.quantity },
    });
  }

  const order = await orderModel.create({
    user: user._id,
    items: validation.items,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      pincode: address.pincode,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
    },
    paymentMethod,
    paymentStatus,
    paymentGateway,
    paymentGatewayOrderId,
    paymentGatewayPaymentId,
    paymentGatewaySignature,
    pricing: {
      totalMRP: summary.totalMRP,
      discount: summary.discount,
      couponCode,
      couponDiscount: couponDiscountAmount,
      platformFee: summary.platformFee,
      finalAmount: actualFinalAmount,
    },
  });

  user.cart = [];
  await user.save();

  return { order, summary };
}

module.exports = {
  buildCartSummary,
  validateCartForOrder,
  createApplicationOrder,
};
