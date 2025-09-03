const express = require('express');
const router = express.Router();

const { getUsers, getUser, updateUser, deleteUser, signout } = require('../controllers/userController')
const { getUserPosts, getUserPost, updateUserPost, deleteUserPost } = require('../controllers/userPostsController')
const { verifyToken } = require('../utils/verifyUser')


router.get('/', getUsers)
router.get('/:id', getUser)
router.patch('/update/:userId', verifyToken, updateUser);
router.delete('/delete/:userId', verifyToken, deleteUser);

router.get('/:userId/posts', getUserPosts)
router.get('/:userId/posts/:postId', verifyToken, getUserPost)
router.patch('/:userId/posts/:postId/update', verifyToken, updateUser);
router.delete('/:userId/posts/:postId/delete', verifyToken, deleteUser);


router.post('/signout', signout);

module.exports = router;

