const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const sharp = require('sharp');  // Sharp kütüphanesini dahil et
const Post = require('./models/post');
const path = require('path');
const fs = require('fs');  // Dosya sistemini kullanacağız

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());  // JSON formatındaki verileri işleyebilmek için
app.use(express.static('public'));  // Statik dosyalar için (resimler ve HTML)

mongoose.connect('mongodb://localhost:27017/postDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// WebSocket bağlantısı
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Multer ile dosya yükleme
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Resimleri 'uploads' dizinine kaydet
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Dosyayı benzersiz bir isimle kaydet
  }
});

const upload = multer({ storage: storage });

// Yeni gönderi eklendiğinde tüm bağlı istemcilere bildirim gönderme
const createPostAndNotify = async (title, content, imageUrl) => {
  try {
    const newPost = new Post({ title, content, imageUrl });
    await newPost.save();

    const message = JSON.stringify({ type: 'newPost', post: newPost });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log('New post created:', newPost);
  } catch (error) {
    console.error('Error creating post:', error);
  }
};

// Gönderi API'leri
app.post('/api/posts', upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  
  // Yüklenen dosyanın yolu
  const originalImagePath = req.file ? path.join('uploads', req.file.filename) : null;

  if (originalImagePath) {
    // Resmi kaliteyi düşürerek işleme
    const compressedImagePath = path.join('uploads', 'compressed_' + req.file.filename);
    
    try {
      await sharp(originalImagePath)
        .resize(800)  // Genişliği 800px'e kadar küçült
        .jpeg({ quality: 70 })  // JPEG kalitesini %70'e düşür
        .toFile(compressedImagePath);  // Yeni resim dosyasını kaydet

      // Orijinal resmi silmek için asenkron unlink kullanın
      fs.unlink(originalImagePath, (err) => {
        if (err) {
          console.error('Error deleting original image:', err);
        } else {
          console.log('Original image deleted');
        }
      });

      const imageUrl = `/uploads/${path.basename(compressedImagePath)}`;  // Yeni dosya URL'si
      await createPostAndNotify(title, content, imageUrl);

      res.status(201).json({ message: 'Post created successfully' });
    } catch (error) {
      console.error('Error compressing image:', error);
      res.status(500).json({ message: 'Error compressing image' });
    }
  } else {
    await createPostAndNotify(title, content, null);
    res.status(201).json({ message: 'Post created successfully without image' });
  }
});

// Tüm gönderileri almak için GET isteği
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();  // Veritabanından tüm gönderiler al
    res.status(200).json(posts);  // Gönderileri JSON formatında döndür
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Dosya Yolu İçin Statik Sunum
app.use('/uploads', express.static('uploads'));  // Yüklenen dosyaların URL'den erişilebilmesi için

// Sunucu başlat
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
