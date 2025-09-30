const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  genre: { type: String },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model("Community", CommunitySchema);
