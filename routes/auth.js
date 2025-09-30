const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const role = (username && username.endsWith('@admin')) ? 'admin' : 'user';
    const user = new User({ username, password, role });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Demo role handling: if username ends with '@admin', mark as admin
    if (username && username.endsWith('@admin') && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    res.json({ message: 'Login successful', userId: user._id, role: user.role || 'user' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in' });
  }
});


module.exports = router;
