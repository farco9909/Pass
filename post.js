const mongoose = require('mongoose');

// Gönderi şeması
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: null }, // Resim URL'si ekledik
  createdAt: { type: Date, default: Date.now } // Gönderi oluşturulma tarihi
});

// Post modeli
const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
