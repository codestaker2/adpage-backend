const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createPost,
  getAllPosts,
  getPostBySlug,
  getPostById,
  updatePost,
  deletePost,
} = require('../controllers/postsController');
const { deleteImage } = require('../controllers/imageController');

const router = express.Router();

// Configure storage for post images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts'); // Destination folder for post images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Unique filename
  },
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadPostImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// 1. CREATE - Create a new post
router.post('/create', createPost);

// 2. READ - Get all posts
router.get('/', getAllPosts);

// 3. READ - Get a specific post by ID
router.get('/:id', getPostById);

router.delete('/:postId/delete-image', deleteImage);

// 4. UPDATE - Update an existing post
router.patch('/update/:id', updatePost);

// 5. DELETE - Delete a post by ID
router.delete('/delete/:id', deletePost);

module.exports = router;

