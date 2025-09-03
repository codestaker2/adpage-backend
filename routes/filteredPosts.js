const express = require('express');
const router = express.Router();

const { filteredPosts } = require('../controllers/filteredPosts')
const { verifyToken } = require('../utils/verifyUser')


router.post('/', filteredPosts)
//router.get('/:id', getUser)
//router.patch('/update/:userId', verifyToken, updateUser);
//router.delete('/delete/:userId', verifyToken, deleteUser);

module.exports = router;
