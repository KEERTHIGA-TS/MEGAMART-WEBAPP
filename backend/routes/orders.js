const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const nodemailer = require("nodemailer");

// Place Order
router.post("/", async (req, res) => {
  try {
    const { userId, products, address, paymentMethod } = req.body;

    const customer = await User.findById(userId);
    // console.log("userId: ",userId);
    console.log("product: ",products);
    
    
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
    });
    order.placedAt = new Date();
    await order.save();

    const populatedOrder = await Order.findById(order._id)
    .populate("userId");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL,
        pass: process.env.GOOGLE_PASS,
      },
    });

    const placedTime=order.placedAt.toLocaleString("en-IN", {
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
            ${address.street}, ${address.city} - ${address.zip}<br/>
          </p>
          <h3>🛍️ Order Summary:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background:#eee">
              <th style="padding:8px;">Name</th>
              <th style="padding:8px;">Price</th>
              <th style="padding:8px;">Quantity</th>
              <th style="padding:8px;">Amount</th>
            </tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="padding:8px;">${p.name}</td>
                  <td style="padding:8px;">${p.price}</td>
                  <td style="padding:8px;">${p.quantity}</td>
                  <td style="padding:8px;">${(p.quantity*p.price)}</td>
                </tr>`).join("")}
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
          <h2 style="color: #FF5722;">📦 New Order Received</h2>
          <p><strong>Customer name:</strong> ${customer.username}</p>
          <p><strong>Email-id:</strong>(${customer.email})</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Placed on:</strong> ${placedTime}</p>
          <h3>📍 Delivery Address:</h3>
          <p>
            ${address.fullName}<br/>
            ${address.phone}<br/>
            ${address.street}, ${address.city} - ${address.zip}<br/>
          </p>

          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background:#eee">
              <th style="padding:8px;">Name</th>
              <th style="padding:8px;">Price</th>
              <th style="padding:8px;">Quantity</th>
              <th style="padding:8px;">Amount</th>
            </tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td style="padding:8px;">${p.name}</td>
                  <td style="padding:8px;">${p.price}</td>
                  <td style="padding:8px;">${p.quantity}</td>
                  <td style="padding:8px;">${(p.quantity*p.price)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
          <p><strong>Payment:</strong> ${paymentMethod}</p>
          <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions);
    transporter.sendMail(adminMailOptions);

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
    //console.log("Order Populated: ",order);
    if (!order) return res.status(404).json({ error: "Order not found" });

    for (let item of order.products) {
      const product = item.productId;
      product.stock += item.quantity; // Restore stock
      await product.save();
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    await order.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL,
        pass: process.env.GOOGLE_PASS,
      },
    });

    const cancelledTime=order.cancelledAt.toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
});

    // User cancel mail
    const userMailOptions = {
      from: `MegaMart <${process.env.GOOGLE_MAIL}>`,
      to: order.userId.email,
      subject: "❌ Order Cancelled - MegaMart",
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#ff0000;">❌ Order Cancelled</h2>
          <p>Hi <strong>${order.userId.username}</strong>, your order <strong>${order._id}</strong> has been cancelled.</p>
          <p><strong>Cancelled On:</strong> ${cancelledTime}</p>
          <h3>📍 Delivery Address:</h3>
          <p>
            ${order.address.fullName}<br/>
            ${order.address.phone}<br/>
            ${order.address.street}, ${order.address.city} - ${order.address.zip}<br/>
          </p>

          <h3>🛍️ Products:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background:#eee;">
              <th style="padding:8px;">Name</th>
              <th style="padding:8px;">Price</th>
              <th style="padding:8px;">Quantity</th>
              <th style="padding:8px;">Amount</th>
            </tr></thead>
            <tbody>
              ${order.products.map(item => `
              <tr>
                <td style="padding:8px;">${item.productId.name}</td>
                <td style="padding:8px;">${item.productId.price}</td>
                <td style="padding:8px;">${item.quantity}</td>
                <td style="padding:8px;">${item.quantity * item.productId.price}</td>
              </tr>`).join("")}

            </tbody>
          </table>

          <p><strong>Refund:</strong> Will be initiated soon if applicable.</p>
        </div>
      `
    };

    // Admin cancel mail
    const adminMailOptions = {
      from: `MegaMart <${process.env.GOOGLE_MAIL}>`,
      to: process.env.GOOGLE_MAIL,
      subject: `⚠️ Order Cancelled: ${order._id}`,
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#ff0000;">⚠️ Order Cancelled</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Customer name:</strong> ${order.userId.username}</p>
          <p><strong>Email-id:</strong>(${order.userId.email})</p>
          <p><strong>Cancelled On:</strong> ${cancelledTime}</p>

          <h3>📍 Delivery Address:</h3>
          <p>
            ${order.address.fullName}<br/>
            ${order.address.phone}<br/>
            ${order.address.street}, ${order.address.city} - ${order.address.zip}<br/>
          </p>

          <table style="width: 100%; border-collapse: collapse;">
            <thead><tr style="background:#eee;">
              <th style="padding:8px;">Name</th>
              <th style="padding:8px;">Price</th>
              <th style="padding:8px;">Quantity</th>
              <th style="padding:8px;">Amount</th>
            </tr></thead>
            <tbody>
              ${order.products.map(item => `
                <tr>
                <td style="padding:8px;">${item.productId.name}</td>
                <td style="padding:8px;">${item.productId.price}</td>
                <td style="padding:8px;">${item.quantity}</td>
                <td style="padding:8px;">${item.quantity * item.productId.price}</td>
              </tr>`).join("")}
            </tbody>
          </table>

          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>
      `
    };

    transporter.sendMail(userMailOptions);
    transporter.sendMail(adminMailOptions);

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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;
