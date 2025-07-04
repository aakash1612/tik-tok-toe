const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'my_super_secret';

// Register user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log("➡️ Registering user:", username);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const existingUser = await User.findOne({ username });
    console.log("👀 Existing user:", existingUser);

    if (existingUser) {
      return res.status(400).json({ message: 'User already exist' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Hashed password:", hashedPassword);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    console.log("✅ New user saved");

  } catch (error) {
    console.error("❌ Error in register:", error);
    res.status(500).json({ message: 'Internal error has occured' });
  }
});

// Login the user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("❌ Error in login:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
