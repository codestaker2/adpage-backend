const express = require('express');
const router = express.Router();
const multer = require('multer');

const { s3Upload } = require('../controllers/s3UploadController')
const { verifyToken } = require('../utils/verifyUser')

// Set up multer for handling file uploads
const storage = multer.memoryStorage();  // Store file in memory (Buffer)
const upload = multer({ storage: storage }).array('images', 5);

router.post('/upload', upload, s3Upload);

module.exports = router;
