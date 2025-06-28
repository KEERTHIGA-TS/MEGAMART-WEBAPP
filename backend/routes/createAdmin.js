// scripts/createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const email = "admin@megamart.com";
  const existing = await User.findOne({ email });

  if (existing) {
    console.log("✅ Admin user already exists:", existing.email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = new User({
    username: "admin",
    email,
    password: hashedPassword,
    role: "admin", // 👑 hardcoded role
  });

  await adminUser.save();
  console.log("🎉 Admin user created successfully!");
  process.exit(0);
}).catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});
