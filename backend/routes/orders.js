const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ============================
   PLACE ORDER
============================ */
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

      item.name = product.name;
      item.price = product.price;
      item.productId = product._id.toString();
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
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    const placedTime = order.placedAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    /* ---------- USER MAIL ---------- */
    const customerMail = {
      to: customer.email,
      from: { email: process.env.FROM_EMAIL, name: "MegaMart" },
      subject: "🛒 Order Confirmation - MegaMart",
      html: `
      <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
        <h2 style="color:#4CAF50;">✅ Thank you for shopping with MegaMart!</h2>
        <p>Hi <strong>${customer.username}</strong>, your order <strong>${order._id}</strong> was placed successfully.</p>
        <p><strong>Placed on:</strong> ${placedTime}</p>

        <h3>📍 Delivery Address</h3>
        <p>${address.fullName}<br/>${address.phone}<br/>
        ${address.street}, ${address.city} - ${address.zip}</p>

        <h3>🛍️ Order Summary</h3>
        <table width="100%" cellpadding="0" cellspacing="0" 
              style="border-collapse:collapse; margin-top:10px;">

          <thead>
            <tr style="background:#f2f2f2;">
              <th align="left"  width="40%" style="padding:10px; font-size:14px;">
                Name
              </th>
              <th align="right" width="20%" style="padding:10px; font-size:14px;">
                Price
              </th>
              <th align="center" width="15%" style="padding:10px; font-size:14px;">
                Qty
              </th>
              <th align="right" width="25%" style="padding:10px; font-size:14px;">
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            ${products.map(p => `
              <tr>
                <td align="left" style="padding:10px; border-bottom:1px solid #eee;">
                  ${p.name}
                </td>
                <td align="right" style="padding:10px; border-bottom:1px solid #eee;">
                  ₹${p.price}
                </td>
                <td align="center" style="padding:10px; border-bottom:1px solid #eee;">
                  ${p.quantity}
                </td>
                <td align="right" style="padding:10px; border-bottom:1px solid #eee;">
                  ₹${p.price * p.quantity}
                </td>
              </tr>
            `).join("")}
          </tbody>

        </table>
        <p><strong>Payment:</strong> ${paymentMethod}</p>
        <p><strong>Total Paid:</strong> ₹${total.toLocaleString()}</p>
        <hr/>
        <p style="text-align:center;">🧡 Thank you for shopping with us!</p>
      </div>`
    };

    /* ---------- ADMIN MAIL ---------- */
    const adminMail = {
      to: process.env.FROM_EMAIL,
      from: { email: process.env.FROM_EMAIL, name: "MegaMart" },
      subject: "📦 New Order Received",
      html: `
      <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
        <h2 style="color:#FF5722;">📦 New Order Received</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Placed on:</strong> ${placedTime}</p>

        <h3>👤 Customer</h3>
        <p>${customer.username}<br/>${customer.email}<br/>${address.phone}</p>

        <h3>📍 Delivery Address</h3>
        <p>${address.street}, ${address.city} - ${address.zip}</p>

        <h3>🛒 Items</h3>
        <table width="100%" cellpadding="0" cellspacing="0" 
      style="border-collapse:collapse; margin-top:10px;">

  <thead>
    <tr style="background:#f2f2f2;">
      <th align="left"  width="40%" style="padding:10px; font-size:14px;">
        Name
      </th>
      <th align="right" width="20%" style="padding:10px; font-size:14px;">
        Price
      </th>
      <th align="center" width="15%" style="padding:10px; font-size:14px;">
        Qty
      </th>
      <th align="right" width="25%" style="padding:10px; font-size:14px;">
        Amount
      </th>
    </tr>
  </thead>

  <tbody>
    ${products.map(p => `
      <tr>
        <td align="left" style="padding:10px; border-bottom:1px solid #eee;">
          ${p.name}
        </td>
        <td align="right" style="padding:10px; border-bottom:1px solid #eee;">
          ₹${p.price}
        </td>
        <td align="center" style="padding:10px; border-bottom:1px solid #eee;">
          ${p.quantity}
        </td>
        <td align="right" style="padding:10px; border-bottom:1px solid #eee;">
          ₹${p.price * p.quantity}
        </td>
      </tr>
    `).join("")}
  </tbody>

</table>

        <p><strong>Payment:</strong> ${paymentMethod}</p>
        <p><strong>Total:</strong> ₹${total.toLocaleString()}</p>
      </div>`
    };

    try {
      await sgMail.send(customerMail);
      await sgMail.send(adminMail);
      console.log("📧 Order emails sent");
    } catch (mailErr) {
      console.error("❌ SendGrid Error:", mailErr.response?.body || mailErr.message);
    }

    res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
});

/* ============================
   CANCEL ORDER
============================ */
router.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId")
      .populate("products.productId");

    if (!order) return res.status(404).json({ error: "Order not found" });

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

    const userMail = {
      to: order.userId.email,
      from: { email: process.env.FROM_EMAIL, name: "MegaMart" },
      subject: "❌ Order Cancelled - MegaMart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#ff0000;">❌ Order Cancelled - MegaMart</h2>

          <p>Hi <strong>${order.userId.username}</strong>,</p>
          <p>Your order <strong>${order._id}</strong> has been cancelled successfully.</p>

          <p><strong>Cancelled on:</strong> ${cancelledTime}</p>

          <h3>📍 Delivery Address:</h3>
          <p>
            ${order.address.fullName}<br/>
            ${order.address.phone}<br/>
            ${order.address.street}, ${order.address.city} - ${order.address.zip}
          </p>

          <h3>🛍️ Cancelled Order Summary:</h3>
          <table width="100%" cellpadding="0" cellspacing="0" 
       style="border-collapse:collapse; margin-top:10px;">

            <thead>
              <tr style="background:#f2f2f2;">
                <th align="left"  width="40%" style="padding:10px; font-size:14px;">
                  Name
                </th>
                <th align="right" width="20%" style="padding:10px; font-size:14px;">
                  Price
                </th>
                <th align="center" width="15%" style="padding:10px; font-size:14px;">
                  Qty
                </th>
                <th align="right" width="25%" style="padding:10px; font-size:14px;">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              ${order.products.map(item => `
                <tr>
                  <td align="left" style="padding:10px;border-bottom:1px solid #eee;">
                    ${item.productId.name}
                  </td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #eee;">
                    ₹${item.productId.price.toLocaleString("en-IN")}
                  </td>
                  <td align="center" style="padding:10px;border-bottom:1px solid #eee;">
                    ${item.quantity}
                  </td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #eee;">
                    ₹${(item.productId.price * item.quantity).toLocaleString("en-IN")}
                  </td>
                </tr>
              `).join("")}
            </tbody>

          </table>


          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Total Refunded / Not Charged:</strong> ₹${order.totalAmount.toLocaleString()}</p>

          <hr />
          <p style="text-align:center;">💔 We’re sorry to see this order cancelled.</p>
        </div>
        `
    };

    const adminMail = {
      to: process.env.FROM_EMAIL,
      from: { email: process.env.FROM_EMAIL, name: "MegaMart" },
      subject: `⚠️ Order Cancelled: ${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color:#ff0000;">⚠️ Order Cancelled</h2>

          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Cancelled on:</strong> ${cancelledTime}</p>

          <h3>👤 Customer Details:</h3>
          <p>
            ${order.userId.username}<br/>
            ${order.userId.email}<br/>
            ${order.address.phone}
          </p>

          <h3>📍 Delivery Address:</h3>
          <p>
            ${order.address.street}, ${order.address.city} - ${order.address.zip}
          </p>

          <h3>🛍️ Cancelled Items:</h3>
          <table width="100%" cellpadding="0" cellspacing="0" 
       style="border-collapse:collapse; margin-top:10px;">

            <thead>
              <tr style="background:#f2f2f2;">
                <th align="left"  width="40%" style="padding:10px; font-size:14px;">
                  Name
                </th>
                <th align="right" width="20%" style="padding:10px; font-size:14px;">
                  Price
                </th>
                <th align="center" width="15%" style="padding:10px; font-size:14px;">
                  Qty
                </th>
                <th align="right" width="25%" style="padding:10px; font-size:14px;">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              ${order.products.map(item => `
                <tr>
                  <td align="left" style="padding:10px;border-bottom:1px solid #eee;">
                    ${item.productId.name}
                  </td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #eee;">
                    ₹${item.productId.price.toLocaleString("en-IN")}
                  </td>
                  <td align="center" style="padding:10px;border-bottom:1px solid #eee;">
                    ${item.quantity}
                  </td>
                  <td align="right" style="padding:10px;border-bottom:1px solid #eee;">
                    ₹${(item.productId.price * item.quantity).toLocaleString("en-IN")}
                  </td>
                </tr>
              `).join("")}
            </tbody>
</table>


          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount.toLocaleString()}</p>

          <hr />
          <p style="text-align:center;">⚠️ Inventory restored automatically.</p>
        </div>
        `

    };

    try {
      await sgMail.send(userMail);
      await sgMail.send(adminMail);
      console.log("📧 Cancellation emails sent");
    } catch (mailErr) {
      console.error("❌ SendGrid Error:", mailErr.response?.body || mailErr.message);
    }

    res.json({ message: "Order cancelled", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cancel failed" });
  }
});

/* ============================
   GET USER ORDERS
============================ */
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
