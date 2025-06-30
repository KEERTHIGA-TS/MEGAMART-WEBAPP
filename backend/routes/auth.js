// File: routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


// POST /signup - Register only as normal user
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "user", // ⬅️ force role to be 'user'
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /login - Generate token and store in MongoDB
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log("user: ",user);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    user.token = token;
    await user.save();

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set true if using HTTPS
      sameSite: "Lax",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.json({
      message: "Login successful",
      userId: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /check
router.get("/check", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ valid: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.token !== token) return res.json({ valid: false });

    return res.json({
      valid: true,
      userId: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    return res.json({ valid: false });
  }
});


// POST /logout - Remove token from MongoDB
router.post("/logout", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    //await User.findByIdAndUpdate(decoded.id, { token: "" });

    if (user && user.token === token) {
      console.log(user.token === token);
      user.token = null;
      await user.save();
    }
    console.log(user.token === token);
    
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // 🔒 true if using HTTPS
      sameSite: "Lax",
      path:"/",
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
