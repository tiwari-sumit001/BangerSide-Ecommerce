const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");
const ownerModel = require("../models/owner-model");
const isOwnerLoggedIn = require("../middlewares/isOwnerLoggedIn");
const { normalizeProductInput, validateProductInput } = require("../utils/productValidation");

router.post("/create", isOwnerLoggedIn, upload.array("images", 5), async (req, res) => {
  try {
    const input = normalizeProductInput(req.body);
    const validationError = validateProductInput(input);

    if (validationError) {
      req.flash("error", validationError);
      return res.redirect("/owners/admin");
    }

    if (!req.files || req.files.length === 0) {
      req.flash("error", "At least one product image is required");
      return res.redirect("/owners/admin");
    }

    const imageBuffers = req.files.map(file => file.buffer);

    const createdProduct = await productModel.create({
      images: imageBuffers,
      image: imageBuffers[0], // Primary image for legacy support
      name: input.name,
      price: input.price,
      discount: input.discount,
      bgcolor: input.bgColor,
      panelcolor: input.panelColor,
      textcolor: input.textColor,
      category: input.category || "General",
      quantity: input.quantity,
      description: input.description,
      gender: input.gender,
      sizes: input.sizes,
    });

    await ownerModel.findByIdAndUpdate(req.owner.id, {
      $push: { products: createdProduct._id },
    });

    req.flash("success", "Product created successfully with " + req.files.length + " images");
    return res.redirect("/owners/admin");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/owners/admin");
  }
});

router.post("/update/:productid", isOwnerLoggedIn, upload.array("images", 5), async (req, res) => {
  try {
    const input = normalizeProductInput(req.body);
    const validationError = validateProductInput(input);

    if (validationError) {
      req.flash("error", validationError);
      return res.redirect(`/owners/products/${req.params.productid}/edit`);
    }

    const product = await productModel.findById(req.params.productid);

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/owners/products");
    }

    product.name = input.name;
    product.price = input.price;
    product.discount = input.discount;
    product.quantity = input.quantity;
    product.category = input.category || "General";
    product.description = input.description;
    product.bgcolor = input.bgColor || product.bgcolor || "#f3f4f6";
    product.panelcolor = input.panelColor || product.panelcolor || "#1f2937";
    product.textcolor = input.textColor || product.textcolor || "#ffffff";
    product.gender = input.gender;
    product.sizes = input.sizes;

    if (req.files && req.files.length > 0) {
      const imageBuffers = req.files.map(file => file.buffer);
      product.images = imageBuffers;
      product.image = imageBuffers[0];
    }

    await product.save();

    req.flash("success", "Product updated successfully");
    return res.redirect("/owners/products");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/owners/products");
  }
});

router.post("/delete/:productid", isOwnerLoggedIn, async (req, res) => {
  try {
    const deletedProduct = await productModel.findByIdAndDelete(req.params.productid);

    if (!deletedProduct) {
      req.flash("error", "Product not found");
      return res.redirect("/owners/products");
    }

    await ownerModel.findByIdAndUpdate(req.owner.id, {
      $pull: { products: deletedProduct._id },
    });

    req.flash("success", "Product deleted successfully");
    return res.redirect("/owners/products");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/owners/products");
  }
});

module.exports = router;
