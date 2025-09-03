const { query } = require('../db'); // Import the query function for database interaction


// 2. READ - Get all posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startIndex = 0, limit = 9 } = req.query; // Default to startIndex = 0 and limit = 9 if not provided

    // Convert startIndex and limit to integers (in case they're provided as strings in the URL)
    const offset = parseInt(startIndex);
    const pageLimit = parseInt(limit)


    const result = await query(
      'SELECT posts.* FROM posts JOIN users ON posts.user_id = users.id WHERE users.id = $1 ORDER BY posts.created_at DESC LIMIT $2 OFFSET $3',
      [userId, pageLimit, offset]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. READ - Get a single post by ID
const getUserPost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM posts WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. UPDATE - Update a post
const updateUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, content, category, images } = req.body;

    // Fetch the existing post first to check for changes
    const existingPostResult = await query('SELECT * FROM posts WHERE id = $1', [id]);
    const existingPost = existingPostResult.rows[0];

    // If the post doesn't exist, return 404
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    // Only change the slug if the title has changed
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      // If title has changed, generate the new slug
      slug = title.split(' ').join('-').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    }


    // Now update the post with the appropriate values
    const result = await query(
      'UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content), slug = $3, category = COALESCE($4, category), images = COALESCE($5, images) WHERE id = $6 RETURNING *',
      [title, content, slug, category, images, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    res.status(200).json({
      message: 'Post updated successfully!',
      post: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 5. DELETE - Delete a post by ID
const deleteUserPost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    res.status(200).json({
      message: 'Post deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserPosts,
  getUserPost,
  updateUserPost,
  deleteUserPost,
};


