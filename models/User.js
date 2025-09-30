const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  profile: {
    displayName: { type: String },
    email: { type: String },
    avatarUrl: { type: String },
    bio: { type: String },
    favoriteGenres: [{ type: String }],
    preferredFormats: [{ type: String }], // e.g., 'ebook', 'paperback', 'hardcover', 'audiobook'
    location: { type: String }
  },
  joinedCommunities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
