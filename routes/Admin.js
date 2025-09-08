const express = require('express');
const router = express.Router();
const Book = require('../models/Admin');

// Add Book
router.post('/', async (req, res) => {
  try {
    const { title, author, year, genre, cover } = req.body;
    const book = new Book({ 
      title, 
      author, 
      year: parseInt(year), 
      genre, 
      cover, 
      rating: (Math.random() * 2 + 3).toFixed(1) // Random rating between 3.0-5.0
    });
    await book.save();
    res.json(book);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ message: 'Error adding book', error: err.message });
  }
});

// Get All Books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ _id: -1 }); // Sort by newest first
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ message: 'Error fetching books', error: err.message });
  }
});

// Delete Book
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully', book });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ message: 'Error deleting book', error: err.message });
  }
});

// Update Book (optional - for future use)
router.put('/:id', async (req, res) => {
  try {
    const { title, author, year, genre, cover, rating } = req.body;
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, year: parseInt(year), genre, cover, rating },
      { new: true, runValidators: true }
    );
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ message: 'Error updating book', error: err.message });
  }
});

// Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ message: 'Error fetching book', error: err.message });
  }
});

module.exports = router;