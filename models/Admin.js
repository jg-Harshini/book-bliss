const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' }, // ✅ link to Author
  year: Number,
  genre: String,
  cover: String,
  rating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Book', bookSchema);
