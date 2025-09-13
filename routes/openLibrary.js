const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch
const router = express.Router();

// Fetch book by title
router.get('/:title', async (req, res) => {
  const title = req.params.title;
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`;

  try {
    const response = await fetch(url);
    
    // Check if the request was successful
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Open Library API error: ${response.status}` 
      });
    }

    const data = await response.json();

    if (!data.docs || data.docs.length === 0) {
      return res.json({ message: "No book found" });
    }

    const book = data.docs[0]; // pick first result
    
    // Try to find a book with an available online version
    let selectedBook = book;
    for (const bookOption of data.docs.slice(0, 3)) { // Check first 3 results
      if (bookOption.ia && bookOption.ia.length > 0) { // Internet Archive availability
        selectedBook = bookOption;
        break;
      }
    }

    // Generate better read links
    let readLink = `https://openlibrary.org${selectedBook.key}`;
    let readingNote = "View book details";
    
    // If Internet Archive versions are available, provide direct reading link
    if (selectedBook.ia && selectedBook.ia.length > 0) {
      readLink = `https://archive.org/details/${selectedBook.ia[0]}`;
      readingNote = "Read online for free";
    }

    res.json({
      title: selectedBook.title,
      author: selectedBook.author_name ? selectedBook.author_name.join(", ") : "Unknown",
      year: selectedBook.first_publish_year || "Unknown",
      readLink: readLink,
      readingNote: readingNote,
      isbn: selectedBook.isbn ? selectedBook.isbn[0] : null,
      publisher: selectedBook.publisher ? selectedBook.publisher[0] : null,
      pageCount: selectedBook.number_of_pages_median || null,
      subjects: selectedBook.subject ? selectedBook.subject.slice(0, 5) : [], // First 5 subjects
      hasOnlineVersion: !!(selectedBook.ia && selectedBook.ia.length > 0)
    });
  } catch (err) {
    console.error('Open Library API error:', err);
    res.status(500).json({ error: 'Failed to fetch book data', details: err.message });
  }
});

// Alternative endpoint to search multiple books
router.get('/search/:query', async (req, res) => {
  const query = req.params.query;
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Open Library API error: ${response.status}` 
      });
    }

    const data = await response.json();

    if (!data.docs || data.docs.length === 0) {
      return res.json({ message: "No books found", results: [] });
    }

    const books = data.docs.map(book => ({
      title: book.title,
      author: book.author_name ? book.author_name.join(", ") : "Unknown",
      year: book.first_publish_year || "Unknown",
      key: book.key,
      hasOnlineVersion: !!(book.ia && book.ia.length > 0)
    }));

    res.json({
      total: data.numFound,
      results: books
    });
  } catch (err) {
    console.error('Open Library search error:', err);
    res.status(500).json({ error: 'Failed to search books', details: err.message });
  }
});

module.exports = router;