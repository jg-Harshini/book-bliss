const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  genre: { type: String }
});

module.exports = mongoose.model("Community", CommunitySchema);
