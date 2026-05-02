function normalizeProductInput(body = {}) {
  return {
    name: body.name ? body.name.trim() : "",
    category: body.category ? body.category.trim() : "",
    description: body.description ? body.description.trim() : "",
    bgColor: body.bgColor ? body.bgColor.trim() : "",
    panelColor: body.panelColor ? body.panelColor.trim() : "",
    textColor: body.textColor ? body.textColor.trim() : "",
    price: Number(body.price),
    discount: Number(body.discount || 0),
    quantity: Number(body.quantity || 0),
    gender: body.gender || "Unisex",
    sizes: Array.isArray(body.sizes) ? body.sizes : (body.sizes ? [body.sizes] : ["S", "M", "L", "XL"]),
  };
}

function validateProductInput(input) {
  if (!input.name) {
    return "Product name is required";
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    return "Product price must be a valid positive number";
  }

  if (!Number.isFinite(input.discount) || input.discount < 0) {
    return "Discount must be a valid positive number";
  }

  if (input.discount > input.price) {
    return "Discount cannot be greater than product price";
  }

  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    return "Stock quantity must be zero or more";
  }

  return null;
}

module.exports = {
  normalizeProductInput,
  validateProductInput,
};
