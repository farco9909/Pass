const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controllers/postController');

// Yeni gönderi eklemek için POST isteği
router.post('/', createPost);

// Gönderileri almak için GET isteği
router.get('/', getPosts);

module.exports = router;
