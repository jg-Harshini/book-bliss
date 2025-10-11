const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');

// GET comments for a book
router.get('/book/:bookId', async (req, res) => {
  try {
    const comments = await Comment.find({ book: req.params.bookId })
      .populate('author', 'username profile.displayName')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET comments for an author
router.get('/author/:authorId', async (req, res) => {
  try {
    const comments = await Comment.find({ authorRef: req.params.authorId })
      .populate('author', 'username profile.displayName')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a comment on a book
router.post('/book/:bookId', async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const comment = new Comment({
      text,
      author: userId,
      book: req.params.bookId
    });

    await comment.save();
    await comment.populate('author', 'username profile.displayName');
    
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a comment on an author
router.post('/author/:authorId', async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const comment = new Comment({
      text,
      author: userId,
      authorRef: req.params.authorId
    });

    await comment.save();
    await comment.populate('author', 'username profile.displayName');
    
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a comment (only by the author)
router.delete('/:commentId', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user is the author of the comment
    if (String(comment.author) !== String(userId)) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
