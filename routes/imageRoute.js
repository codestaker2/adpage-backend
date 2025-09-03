const express = require('express');
const router = express.Router();

const { deleteImage } = require('../controllers/imageController')
//const { verifyToken } = require('../utils/verifyUser')


router.post('/delete-image', deleteImage)

module.exports = router;
