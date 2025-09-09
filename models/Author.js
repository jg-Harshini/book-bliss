const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  detail: { type: String },
  photo: { type: String },       // relative path or URL
  genre: { type: String },
  debutYear: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Author', authorSchema);
