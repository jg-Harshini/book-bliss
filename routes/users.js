const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user by ID (including profile and joined communities)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('joinedCommunities', 'name description genre');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user profile by ID
router.put('/:id', async (req, res) => {
  try {
    const update = {};
    if (req.body.profile) update.profile = req.body.profile;
    if (req.body.role) update.role = req.body.role; // optional, typically admin-only

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('joinedCommunities', 'name description genre');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

module.exports = router;
