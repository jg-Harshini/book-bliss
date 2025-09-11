const express = require("express");
const router = express.Router();
const Community = require("../models/Community");

// POST: Add a new community
router.post("/", async (req, res) => {
  try {
    const { name, description, genre } = req.body;
    const newCommunity = new Community({ name, description, genre });
    await newCommunity.save();
    res.json({ message: "✅ Community added", community: newCommunity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch all communities
router.get("/", async (req, res) => {
  try {
    const communities = await Community.find();
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
