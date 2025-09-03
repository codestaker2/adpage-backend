const { query } = require('../db');

const createComment = async (req,res) => {
  try {
    const { content, postId, userId } = req.body;
    // Check if the user is authorized to create the comment
    if (userId !== req.user.id) {
        return res.status(403).json({ message: 'You are not allowed to create this comment' })
    }

    // Insert the new comment into the 'comments' table
    const sql = `
      INSERT INTO comments (content, post_id, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [content, postId, userId];

    // Execute the query and get the inserted comment
    const result = await query(sql, values);
    const newComment = result.rows[0];

    // Send back the new comment
    res.status(200).json(newComment);
  } catch (error) {
    console.log(error)
  }

}

const getComments = async (req,res) => {
  const startIndex = parseInt(req.query.startIndex) || 0;
  const limit = 9; // number of comments per page

  try {
    // Query to get all comments
    const result = await query('SELECT * FROM comments ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, startIndex]);

    const comments = result.rows;

    // Getting the total number of comments
    const totalCommentsResult = await query('SELECT COUNT(*) FROM comments', []);
    const totalComments = parseInt(totalCommentsResult.rows[0].count);

    // Getting the number of users created within the last month
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const lastMonthCommentsResult = await query(
      'SELECT COUNT(*) FROM comments WHERE created_at >= $1',
      [oneMonthAgo]
    );
    const lastMonthComments = parseInt(lastMonthCommentsResult.rows[0].count);

    // send the response with the comments list
    res.status(200).json({
      comments,
      totalComments,
      lastMonthComments
    })
  } catch(error) {
      console.error(error)
      res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getComment = async (req,res) => {
  try {
    const { postId } = req.params;
    
    // SQL query to get comments by post_id and sort them by created_at in descending order
    const sql = `
      SELECT * 
      FROM comments 
      WHERE post_id = $1
      ORDER BY created_at DESC;
    `;

    // Execute the query
    const result = await query(sql, [postId]);

    // Send the results as a JSON response
    res.status(200).json(result.rows);  // result.rows contains the returned rows from the query
  } catch (error) {
    console.log(error);
  }

}
const updateComment = async (req,res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    // Step 1: Find the comment by commentId
    const findQuery = 'SELECT * FROM comments WHERE id = $1';
    const result = await query(findQuery, [commentId]);
    const comment = result.rows[0];
console.log("comment",comment)
    if (!comment) {
      //return next(errorHandler(404, 'Comment not found'));
      return res.status(404).json({ message: 'Comment not found'})
    }

    // Step 2: Check if the user is authorized to edit the comment
// if (comment.user_id !== req.user.id && req.user.is_admin) {
    if (comment.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You are not allowed to edit this comment'})
    }

    // Step 3: Update the comment's content in the database
    const updateQuery = `
      UPDATE comments
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const updateValues = [content, commentId];
    const updateResult = await query(updateQuery, updateValues);
    const editedComment = updateResult.rows[0];

    // Step 4: Send the updated comment as the response
    return res.status(200).json(editedComment);
  } catch (error) {
    console.log(error)
  }
}
const deleteComment = async (req,res) => {
try {
  // Fetch the comment from the database
  const { rows: comments } = await query(
    'SELECT * FROM comments WHERE id = $1',
    [req.params.commentId]
  );

  if (comments.length === 0) {
    return next(errorHandler(404, 'Comment not found'));
  }

  const comment = comments[0];

  // Check if the user is allowed to delete the comment (only the owner or admin)
  if (comment.user_id !== req.user.id && !req.user.isAdmin) {
    return next(errorHandler(403, 'You are not allowed to delete this comment'));
  }

  // Delete the comment
  await query(
    'DELETE FROM comments WHERE id = $1',
    [req.params.commentId]
  );

  // Respond with success
  res.status(200).json('Comment has been deleted');
} catch (error) {
  console.log(error)
}
}

const likeComment = async (req,res) => {
    console.log("req.params",req.params)
    try {
    const { commentId } = req.params;

    // Step 1: Find the comment by commentId
    const sql = 'SELECT * FROM comments WHERE id = $1';
    const result = await query(sql, [commentId]);
    const comment = result.rows[0];
console.log("comment",comment)

    if (!comment) {
      return res.status(404, 'Comment not found');
    }

    // Step 2: Check if the user has already liked the comment
    const userIndex = comment.likes.indexOf(req.user.id);

    if (userIndex === -1) {
      // User hasn't liked the comment, so we add them to the likes array
      comment.likes.push(req.user.id);
      comment.numberoflikes += 1;
    } else {
      // User has already liked the comment, so we remove them from the likes array
      comment.likes.splice(userIndex, 1);
      comment.numberoflikes -= 1;
    }

    // Step 3: Update the comment in the database with the modified likes and numberOfLikes
    const updateQuery = `
      UPDATE comments
      SET likes = $1, numberoflikes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    
    const updateValues = [comment.likes, comment.numberoflikes, commentId];
    const updateResult = await query(updateQuery, updateValues);
    const updatedComment = updateResult.rows[0];

    // Step 4: Send the updated comment as the response
    res.status(200).json(updatedComment);
  } catch (error) {
    console.log(error)
  }
}

module.exports = { createComment, getComments, getComment, updateComment, deleteComment, likeComment }
