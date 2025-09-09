const express = require('express');
const router = express.Router();
const Book = require('../models/Admin');
const Author = require('../models/Author');

// ✅ Add Book
router.post('/', async (req, res) => {
  try {
    const { title, author, year, genre, cover } = req.body;

    // author should already be ObjectId from dropdown
    const authorDoc = await Author.findById(author);
    if (!authorDoc) {
      return res.status(400).json({ message: 'Author not found in DB' });
    }

    const book = new Book({
      title,
      author: authorDoc._id,
      year: parseInt(year),
      genre,
      cover,
      rating: (Math.random() * 2 + 3).toFixed(1) // random rating 3.0–5.0
    });

    await book.save();
    const populatedBook = await book.populate('author');
    res.json(populatedBook);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ message: 'Error adding book', error: err.message });
  }
});

// ✅ Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ message: 'Error fetching book', error: err.message });
  }
});

// ✅ Get all books (optionally filter by author)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.author) {
      query.author = req.query.author; // filter by authorId if provided
    }

    const books = await Book.find(query)
      .populate('author')
      .sort({ _id: -1 });

    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ message: 'Error fetching books', error: err.message });
  }
});

// ✅ Delete Book
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully', book });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ message: 'Error deleting book', error: err.message });
  }
});

// ✅ Update Book
router.put('/:id', async (req, res) => {
  try {
    const { title, author, year, genre, cover, rating } = req.body;

    let authorId = author;
    if (author) {
      const authorDoc = await Author.findById(author);
      if (!authorDoc) {
        return res.status(400).json({ message: 'Author not found in DB' });
      }
      authorId = authorDoc._id;
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author: authorId, year: parseInt(year), genre, cover, rating },
      { new: true, runValidators: true }
    ).populate('author');

    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ message: 'Error updating book', error: err.message });
  }
});

module.exports = router;
