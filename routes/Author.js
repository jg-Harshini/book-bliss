const express = require('express');
const router = express.Router();
const Author = require('../models/Author');

// Add Author
router.post('/', async (req, res) => {
  try {
    const { name, detail, photo, genre, debutYear } = req.body;
    const author = new Author({ name, detail, photo, genre, debutYear });
    await author.save();
    res.json(author);
  } catch (err) {
    res.status(500).json({ message: 'Error adding author', error: err.message });
  }
});

// ✅ Get All Authors (with optional name filter)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.name) {
      query.name = new RegExp(req.query.name, 'i'); // case-insensitive search
    }
    const authors = await Author.find(query).sort({ createdAt: -1 });
    res.json(authors);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching authors', error: err.message });
  }
});


// Get Single Author
router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching author', error: err.message });
  }
});

// Update Author
router.put('/:id', async (req, res) => {
  try {
    const { name, detail, photo, genre, debutYear } = req.body;
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      { name, detail, photo, genre, debutYear },
      { new: true }
    );
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (err) {
    res.status(500).json({ message: 'Error updating author', error: err.message });
  }
});

// Delete Author
router.delete('/:id', async (req, res) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json({ message: 'Author deleted successfully', author });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting author', error: err.message });
  }
});

module.exports = router;
