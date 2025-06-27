// File: routes/cart.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");

// Get cart for user
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate("items.productId");
    res.json(cart || { userId: req.params.userId, items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update item in cart
router.post("/", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId }).populate("items.productId");
    console.log("cart: ",cart);
    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity }] });
    } else {
      console.log("cart.items: ",cart.items);
      const index = cart.items.findIndex((item) => (item.productId._id).toString() === productId);
      console.log("index: "+index);
      if (index > -1) {
        cart.items[index].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update quantity of an item
router.put("/update/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;
  console.log(quantity);

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    //console.log(cart);

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    console.log(item);
    //if (!item) return res.status(404).json({ error: "Item not found in cart" });

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Remove an item from cart
router.delete("/remove/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
