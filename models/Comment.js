const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Either book or authorRef will be populated, not both
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  authorRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
commentSchema.index({ book: 1, createdAt: -1 });
commentSchema.index({ authorRef: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
