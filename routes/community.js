const express = require("express");
const router = express.Router();
const Community = require("../models/Community");
const User = require("../models/User");
const Message = require("../models/Message");

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

// POST: Join a community (normal users only)
router.post('/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const [user, community] = await Promise.all([
      User.findById(userId),
      Community.findById(req.params.id)
    ]);

    if (!user || !community) return res.status(404).json({ message: 'User or Community not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admins cannot join communities' });

    const alreadyMember = (user.joinedCommunities || []).some(c => String(c) === String(community._id));
    if (alreadyMember) return res.json({ message: 'Already a member' });

    user.joinedCommunities = user.joinedCommunities || [];
    user.joinedCommunities.push(community._id);
    community.members = community.members || [];
    community.members.push(user._id);

    await Promise.all([user.save(), community.save()]);
    res.json({ message: 'Joined community', communityId: community._id });
  } catch (err) {
    res.status(500).json({ message: 'Error joining community' });
  }
});

// GET: Messages for a community
router.get('/:id/messages', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : null;
    const query = { community: req.params.id };
    if (since) query.createdAt = { $gt: since };

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .populate('sender', 'username profile.displayName');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// POST: Send a message to a community
router.post('/:id/messages', async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) return res.status(400).json({ message: 'userId and text are required' });

    const [user, community] = await Promise.all([
      User.findById(userId),
      Community.findById(req.params.id)
    ]);
    if (!user || !community) return res.status(404).json({ message: 'User or Community not found' });

    const isMember = (user.joinedCommunities || []).some(c => String(c) === String(community._id));
    if (!isMember) return res.status(403).json({ message: 'Join the community to send messages' });

    const msg = await new Message({ community: community._id, sender: user._id, text }).save();
    const populated = await msg.populate('sender', 'username profile.displayName');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

module.exports = router;
