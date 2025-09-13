const express = require("express");
const router = express.Router();
const axios = require("axios"); // Make sure to install: npm install axios
const Book = require("../models/Admin");
const Author = require("../models/Author");

// Simple rule-based chatbot
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    const msg = message.toLowerCase();

    let reply = "Sorry, I didn't understand that. Try asking about books or authors.";

    // 1️⃣ Ask for all books
    if (msg.includes("all books") || msg.includes("list books")) {
      const books = await Book.find().populate("author");
      reply = books.length
        ? "📚 Books in our library:\n" + books.map(b => `• ${b.title} by ${b.author.name}`).join("\n")
        : "No books found in the library.";
    }

    // 2️⃣ Ask for all authors
    else if (msg.includes("all authors") || msg.includes("list authors")) {
      const authors = await Author.find();
      reply = authors.length
        ? "✍️ Authors in our library:\n" + authors.map(a => `• ${a.name} (${a.genre || "N/A"})`).join("\n")
        : "No authors found.";
    }

    // 3️⃣ Search book by title (but not if it's a "read" command)
    else if (msg.includes("book") && !msg.startsWith("read ")) {
      const title = msg.replace("book", "").trim();
      if (title) {
        const book = await Book.findOne({ title: new RegExp(title, "i") }).populate("author");
        reply = book
          ? `📖 **${book.title}** by ${book.author.name}\n` +
            `📚 Genre: ${book.genre}\n` +
            `⭐ Rating: ${book.rating}/5\n\n` +
            `💡 Want to read it online? Try: "read ${book.title}"`
          : `Book "${title}" not found in our library. Try "read ${title}" to search online libraries.`;
      } else {
        reply = "Please provide a book title. Example: 'search book Harry Potter'";
      }
    }

    // 4️⃣ Search author by name
    else if (msg.includes("author")) {
      const name = msg.replace("author", "").trim();
      if (name) {
        const author = await Author.findOne({ name: new RegExp(name, "i") });
        reply = author
          ? `👤 **${author.name}**\n` +
            `📚 Genre: ${author.genre}\n` +
            `🎯 Debut Year: ${author.debutYear}`
          : `Author "${name}" not found in our library.`;
      } else {
        reply = "Please provide an author name. Example: 'author J.K. Rowling'";
      }
    }

    // 5️⃣ Read a specific book online
    else if (msg.startsWith("read ")) {
      // Extract book name from various patterns
      let bookName = message;
      if (msg.startsWith("read ")) {
        bookName = message.replace(/read\s+/i, "").trim();
      } else if (msg.includes("i want to read")) {
        bookName = message.replace(/.*i want to read\s+/i, "").trim();
      } else if (msg.includes("can i read")) {
        bookName = message.replace(/.*can i read\s+/i, "").trim();
      } else if (msg.includes("where can i find")) {
        bookName = message.replace(/.*where can i find\s+/i, "").trim();
      } else if (msg.includes("link to read")) {
        bookName = message.replace(/.*link to read\s+/i, "").trim();
      } else if (msg.includes("online version")) {
        bookName = message.replace(/.*online version.*of\s+/i, "").trim();
      }
      
      if (!bookName) {
        reply = "Please specify a book title. Example: 'read Pride and Prejudice'";
      } else {
        try {
          // Call your Open Library API endpoint
          const response = await axios.get(`${req.protocol}://${req.get('host')}/api/open-library/${encodeURIComponent(bookName)}`);
          const bookData = response.data;
          
          if (bookData.message && bookData.message.includes("No book found")) {
            // Check if it's a book from our library that might be copyrighted
            const libraryBook = await Book.findOne({ title: new RegExp(bookName, "i") }).populate("author");
            if (libraryBook) {
              reply = `📚 "${libraryBook.title}" by ${libraryBook.author.name}\n\n` +
                     `❗ This book may still be under copyright protection and not available for free online reading.\n\n` +
                     `💡 **Alternatives:**\n` +
                     `• Check your local library\n` +
                     `• Visit libraries with digital lending\n` +
                     `• Consider purchasing from official retailers`;
            } else {
              reply = `📚 Sorry, I couldn't find "${bookName}" in online libraries.\n\n` +
                     `💡 Try searching with a different title or check our library: "search book ${bookName}"`;
            }
          } else {
            reply = `📖 **${bookData.title}** by ${bookData.author} (${bookData.year || "N/A"})\n\n`;
            
            if (bookData.hasOnlineVersion) {
              reply += `✅ **Available to read online for FREE!**\n` +
                      `🔗 [Read Now](${bookData.readLink})\n\n` +
                      `📝 This book is available through Internet Archive - completely legal and free!`;
            } else {
              reply += `📚 [View Book Details](${bookData.readLink})\n\n` +
                      `ℹ️ This book's details are available on Open Library, but it may not have a free online version yet.`;
            }
            
            // Add additional info if available
            if (bookData.pageCount) {
              reply += `\n📄 Pages: ${bookData.pageCount}`;
            }
            if (bookData.publisher) {
              reply += `\n🏢 Publisher: ${bookData.publisher}`;
            }
          }
        } catch (error) {
          console.error("🚨 Open Library API error:", error.message); // Better error logging
          console.error("🚨 Full error:", error.response?.data || error); // More details
          reply = `❌ Sorry, I encountered an error while searching for "${bookName}". Please try again later.`;
        }
      }
    }

    // 6️⃣ General help
    else if (msg.includes("help") || msg === "hi" || msg === "hello") {
      reply = `👋 Hello! I'm your library chatbot. Here's what I can do:\n\n` +
             `📚 **Library Commands:**\n` +
             `• "all books" - List all books in our library\n` +
             `• "all authors" - List all authors\n` +
             `• "book [title]" - Search for a book in our library\n` +
             `• "author [name]" - Find information about an author\n\n` +
             `🌐 **Online Reading:**\n` +
             `• "read [book title]" - Find free online versions\n\n` +
             `💡 **Examples:**\n` +
             `• "read Pride and Prejudice"\n` +
             `• "book Harry Potter"\n` +
             `• "author Shakespeare"`;
    }

    // 7️⃣ Book recommendations
    else if (msg.includes("recommend") || msg.includes("suggestion")) {
      const books = await Book.find().populate("author").sort({ rating: -1 }).limit(3);
      if (books.length > 0) {
        reply = `⭐ **Top Recommended Books:**\n\n` +
               books.map((book, index) => 
                 `${index + 1}. **${book.title}** by ${book.author.name}\n` +
                 `   ⭐ ${book.rating}/5 | 📚 ${book.genre}\n` +
                 `   💡 Try: "read ${book.title}"`
               ).join("\n\n");
      } else {
        reply = "No books available for recommendations.";
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ 
      reply: "❌ Sorry, I'm experiencing some technical difficulties. Please try again later.", 
      error: err.message 
    });
  }
});

module.exports = router;