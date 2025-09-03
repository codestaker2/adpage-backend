const express = require('express');
const router = express.Router();

const { createComment, getComments, getComment, updateComment, deleteComment, likeComment  } = require('../controllers/commentsController')
const { verifyToken } = require('../utils/verifyUser')


router.post('/create', verifyToken, createComment);
router.get('/getComments', getComments);
router.get('/:postId', getComment);
router.put('/editComment/:commentId', verifyToken, updateComment);
router.delete('/deleteComment/:commentId', verifyToken, deleteComment);
router.put('/likecomment/:commentId', verifyToken, likeComment);


module.exports = router;

