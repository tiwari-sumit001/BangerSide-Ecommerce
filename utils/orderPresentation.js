function getPaymentMethodLabel(paymentMethod) {
  if (paymentMethod === "cod") {
    return "Cash on Delivery";
  }

  if (paymentMethod === "upi") {
    return "UPI";
  }

  if (paymentMethod === "card") {
    return "Card";
  }

  return "Unknown";
}

function getPaymentStatusLabel(order) {
  if (order.orderStatus === "cancelled") {
    return order.paymentMethod === "cod" ? "Cancelled" : "Refund Pending";
  }

  if (order.paymentMethod === "cod") {
    if (order.orderStatus === "delivered") {
      return "Collected";
    }

    return "Pay on Delivery";
  }

  if (order.paymentStatus === "paid") {
    return "Paid Online";
  }

  if (order.paymentStatus === "failed") {
    return "Payment Failed";
  }

  return "Payment Pending";
}

function decorateOrder(order) {
  const plainOrder = order.toObject ? order.toObject() : order;

  if (plainOrder.items && Array.isArray(plainOrder.items)) {
    plainOrder.items = plainOrder.items.map(item => {
      if (item.image) {
        let base64String = "";
        if (Buffer.isBuffer(item.image)) {
          base64String = item.image.toString("base64");
        } else if (item.image.data) {
          // Handling Mongoose toObject() Buffer representation { type: "Buffer", data: [...] }
          base64String = Buffer.from(item.image.data).toString("base64");
        } else if (typeof item.image.toString === 'function') {
          base64String = item.image.toString("base64");
        }
        item.imageSrc = `data:image/jpeg;base64,${base64String}`;
      } else {
        item.imageSrc = "https://via.placeholder.com/150";
      }
      return item;
    });
  }

  return {
    ...plainOrder,
    paymentMethodLabel: getPaymentMethodLabel(plainOrder.paymentMethod),
    paymentStatusLabel: getPaymentStatusLabel(plainOrder),
  };
}

module.exports = {
  decorateOrder,
};
