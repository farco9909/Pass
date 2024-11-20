const Post = require('../models/post');

// Yeni gönderi oluşturma
const createPost = async (req, res) => {
  const { title, content } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;  // Yüklenen resmin URL'sini al

  try {
    // Yeni post oluşturuluyor
    const newPost = new Post({ title, content, imageUrl });  // Resim URL'si de eklendi
    await newPost.save();
    
    // Başarılı cevap
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    console.error('Error creating post:', err);  // Hata detaylarını logla
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

// Gönderileri getirme
const getPosts = async (req, res) => {
  try {
    // Veritabanından tüm gönderiler alınıyor
    const posts = await Post.find().sort({ createdAt: -1 }); // En yeni gönderiyi üstte getir
    res.status(200).json(posts);  // Gönderiler JSON formatında döndürülür
  } catch (err) {
    console.error('Error fetching posts:', err); // Hata logu
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
};

module.exports = { createPost, getPosts };
