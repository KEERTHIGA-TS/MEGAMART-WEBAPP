const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");

// Place Order
router.post("/", async (req, res) => {
  try {
    const { userId, products, address, paymentMethod } = req.body;

    const customer = await User.findById(userId);
    if (!customer) return res.status(404).json({ error: "User not found" });

    let total = 0;
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
      if (product.stock < item.quantity)
        return res.status(400).json({ error: "Out of stock" });

      total += product.price * item.quantity;
      product.stock -= item.quantity;
      await product.save();

      // snapshot product data
      item.name = product.name;
      item.productId = product._id.toString();
      item.price = product.price;
    }

    const order = new Order({
      userId,
      products,
      address,
      paymentMethod,
      totalAmount: total,
      placedAt: new Date(),
    });

    await order.save();

    // clear cart
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }
    );

    const populatedOrder = await Order.findById(order._id)
      .populate("userId");

    // 📧 Gmail App Password transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL,
        pass: process.env.GOOGLE_PASS,
      },
    });

    const placedTime = order.placedAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    // CUSTOMER MAIL
    const mailOptions = {
      from: `MegaMart <${process.env.GOOGLE_MAIL}>`,
      to: populatedOrder.userId.email,
      subject: "🛒 Order Confirmation - MegaMart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Thank you for shopping with MegaMart!</h2>
          <p>Hi <strong>${customer.username}</strong>, your order <strong>${order._id}</strong> was placed successfully.</p>
          <p><strong>Placed on:</strong> ${placedTime}</p>

          <h3>📍 Delivery Address:</h3>
          <p>
            ${address.fullName}<br/>
            ${address.phone}<br/>
            ${address.street}, ${address.city} - ${address.zip}
          </p>

          <h3>🛍️ Order Summary:</h3>
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background:#eee">
                <th style="padding:8px;">Name</th>
                <th style="padding:8px;">Price</th>
                <th style="padding:8px;">Qty</th>
                <th style="padding:8px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="padding:8px;">${p.name}</td>
                  <td style="padding:8px;">₹${p.price}</td>
                  <td style="padding:8px;">${p.quantity}</td>
                  <td style="padding:8px;">₹${p.price * p.quantity}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <p><strong>Payment:</strong> ${paymentMethod}</p>
          <p><strong>Total Paid:</strong> ₹${total.toLocaleString()}</p>

          <hr />
          <p style="text-align:center;">🧡 Thank you for shopping with us!</p>
        </div>
      `
    };

    // ADMIN MAIL
    const adminMailOptions = {
      from: `MegaMart <${process.env.GOOGLE_MAIL}>`,
      to: process.env.GOOGLE_MAIL,
      subject: "📦 New Order Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#FF5722;">📦 New Order Received</h2>
          <p><strong>Customer:</strong> ${customer.username} (${customer.email})</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Placed on:</strong> ${placedTime}</p>

          <h3>📍 Delivery Address:</h3>
          <p>
            ${address.fullName}<br/>
            ${address.phone}<br/>
            ${address.street}, ${address.city} - ${address.zip}
          </p>

          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background:#eee">
                <th style="padding:8px;">Name</th>
                <th style="padding:8px;">Price</th>
                <th style="padding:8px;">Qty</th>
                <th style="padding:8px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="padding:8px;">${p.name}</td>
                  <td style="padding:8px;">₹${p.price}</td>
                  <td style="padding:8px;">${p.quantity}</td>
                  <td style="padding:8px;">₹${p.price * p.quantity}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
          <p><strong>Payment:</strong> ${paymentMethod}</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      await transporter.sendMail(adminMailOptions);
      console.log("Mail sent successfully!");
    } catch(err) {
      console.log("Mail send fail da: ", err.message);
    }

    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
});

// Cancel Order
router.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId")
      .populate("products.productId");

    if (!order) return res.status(404).json({ error: "Order not found" });

    // restore stock
    for (let item of order.products) {
      item.productId.stock += item.quantity;
      await item.productId.save();
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    await order.save();

    const cancelledTime = order.cancelledAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL,
        pass: process.env.GOOGLE_PASS,
      },
    });

    // USER MAIL
    const userMailOptions = {
      from: `MegaMart <${process.env.GOOGLE_MAIL}>`,
      to: order.userId.email,
      subject: "❌ Order Cancelled - MegaMart",
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto; padding:20px;">
          <h2 style="color:#ff0000;">❌ Order Cancelled</h2>
          <p>Hi <strong>${order.userId.username}</strong>, your order <strong>${order._id}</strong> has been cancelled.</p>
          <p><strong>Cancelled On:</strong> ${cancelledTime}</p>
        </div>
      `
    };

    // ADMIN MAIL
    const adminMailOptions = {
      from: `MegaMart <${process.env.GOOGLE_MAIL}>`,
      to: process.env.GOOGLE_MAIL,
      subject: `⚠️ Order Cancelled: ${order._id}`,
      html: `
        <div style="font-family: Arial; max-width:600px; margin:auto; padding:20px;">
          <h2 style="color:#ff0000;">⚠️ Order Cancelled</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Customer:</strong> ${order.userId.username} (${order.userId.email})</p>
        </div>
      `
    };

    
    try {
      await transporter.sendMail(userMailOptions);
      await transporter.sendMail(adminMailOptions);
      console.log("Mail sent successfully!");
    } catch(err) {
      console.log("Mail send fail da: ", err.message);
    }

    res.json({ message: "Order cancelled and emails sent", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cancel failed" });
  }
});

// Get Orders
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate("products.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;
