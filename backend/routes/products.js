const express = require("express");
const Product = require("../models/Product");
const upload = require("../config/multer"); // uses Cloudinary storage

const router = express.Router();

// 📦 Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// 🔍 Search
router.get("/search", async (req, res) => {
  const query = req.query.q;
  try {
    const products = await Product.find({
      name: { $regex: query, $options: "i" },
    }).limit(10);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// 🔍 Get by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ➕ Add product (with Cloudinary image upload)
router.post("/", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ FILE:", req.file);

    const { name, description, price, category, brand, discount, stock } = req.body;
    const image = req.file ? req.file.path : "";

    console.log("Parsed fields:", {
      name,
      description,
      price,
      category,
      brand,
      discount,
      stock,
      image,
    });

    const product = new Product({
      name,
      description,
      price: Number(price),
      image,
      category,
      brand,
      discount: discount ? Number(discount) : 0,
      stock: stock ? Number(stock) : 0,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
      const details =
        typeof err.message === "string"
          ? err.message
          : JSON.stringify(err.message);
    
      res.status(500).json({
        error: "Failed to create product",
        details,
      });
    }
});


// ✏️ Update product
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.image = req.file.path; // Cloudinary image URL
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updatedProduct) return res.status(404).json({ error: "Product not found" });

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ❌ Delete product
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
