const { query } = require('../db'); // Import the query function for database interaction

// 1. CREATE - Create a new post
const createPost = async (req, res) => {
  try {
    const { user_id, title, content, location, category, images, expires, days_listed, price } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required!' });
    }

    const slug = req.body.title.split(' ').join('-').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');

    const result = await query(
      'INSERT INTO posts (user_id, title, location, content, slug, category, images, expires, days_listed, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [user_id, title, location, content, slug, category, images, expires, days_listed, price]
    );

    return res.status(201).json({
      message: 'Post created successfully!',
      post: result.rows[0], // Return the created post details
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error });
  }
};

const getAllPostsOLD = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;

    // Fetching the posts
    const result = await query('SELECT * FROM posts ORDER BY posts.created_at DESC LIMIT $1 OFFSET $2', [limit, startIndex] );
    const posts = result.rows;

    // Getting the total number of posts
    const totalPostsResult = await query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(totalPostsResult.rows[0].count);

    // Getting the total number of posts by location
    const totalPostsByLocationResult = await query(
      'SELECT COUNT(*) FROM posts WHERE location = $1',
      [req.query.location] // Assuming `location` is passed in the query params
    );
    const totalPostsByLocation = parseInt(totalPostsByLocationResult.rows[0].count);

    // Getting the number of posts created within the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthPostsResult = await query(
      'SELECT COUNT(*) FROM posts WHERE created_at >= $1',
      [oneMonthAgo]
    );
    const lastMonthPosts = parseInt(lastMonthPostsResult.rows[0].count);

    res.status(200).json({
      posts,
      totalPosts,
      totalPostsByLocation,
      lastMonthPosts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    next(error);
  }
}

const getAllPosts = async (req, res, next) => {
  console.log("req.query", req.query);
  console.log("req.body", req.body);
  console.log("req.user", req.user);
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order === 'asc' ? 'ASC' : 'DESC'; // Sorting direction

    // Base SQL query for posts
    let sql = `
      SELECT * FROM posts
      WHERE 1 = 1  -- Placeholder for dynamic WHERE clauses
    `;

    // Array to store query parameters
    let params = [];

    // Apply filters based on query parameters
    if (req.query.userId) {
      sql += ' AND user_id = $' + (params.length + 1);  // Assuming 'user_id' is a field in the 'posts' table
      params.push(req.query.userId);
    }

    if (req.query.location) {
      sql += ' AND location = $' + (params.length + 1);  // Assuming 'location' is a field in 'posts'
      params.push(req.query.location);
    }

    if (req.query.postStatus) {
      sql += ' AND post_status = $' + (params.length + 1);  // Assuming 'post_status' is a field in 'posts'
      params.push(req.query.postStatus);
    }

    if (req.query.category) {
      sql += ' AND category = $' + (params.length + 1);  // Assuming 'category' is a field in 'posts'
      params.push(req.query.category);
    }

    if (req.query.slug) {
      sql += ' AND slug = $' + (params.length + 1);  // Assuming 'slug' is a field in 'posts'
      params.push(req.query.slug);
    }

    if (req.query.postId) {
      sql += ' AND id = $' + (params.length + 1);  // Assuming 'id' is the primary key field
      params.push(req.query.postId);
    }

    if (req.query.searchTerm) {
      sql += ' AND (title ILIKE $' + (params.length + 1) + ' OR content ILIKE $' + (params.length + 2) + ')';
      params.push('%' + req.query.searchTerm + '%', '%' + req.query.searchTerm + '%');
    }

    // Sorting by 'created_at' or 'updated_at'
    sql += ` ORDER BY created_at ${sortDirection}`;

    // Pagination (limit and offset)
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, startIndex);

    // Fetching posts with applied filters
    const postsResult = await query(sql, params);
    console.log("postsResult", postsResult);
    const posts = postsResult.rows;

    // Getting the total number of posts
    const totalPostsResult = await query('SELECT COUNT(*) FROM posts', []);
    const totalPosts = parseInt(totalPostsResult.rows[0].count);

    // Getting the total number of posts by location
    const totalPostsByLocationResult = await query(
      'SELECT COUNT(*) FROM posts WHERE location = $1',
      [req.query.location] // Assuming `location` is passed in the query params
    );
    const totalPostsByLocation = parseInt(totalPostsByLocationResult.rows[0].count);

    // Getting the total number of posts by location
    const totalActivePostsByLocationResult = await query(
      'SELECT COUNT(*) FROM posts WHERE location = $1 AND post_status = $2',
      [req.query.location, 'active'] // Assuming `location` is passed in the query params
    );
    const totalActivePostsByLocation = parseInt(totalActivePostsByLocationResult.rows[0].count);

    // Getting the number of posts created within the last month
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const lastMonthPostsResult = await query(
      'SELECT COUNT(*) FROM posts WHERE created_at >= $1',
      [oneMonthAgo]
    );
    const lastMonthPosts = parseInt(lastMonthPostsResult.rows[0].count);

    // Send the response with posts, total count, and last month's count
    res.status(200).json({
      posts,
      totalPosts,
      totalPostsByLocation,
      totalActivePostsByLocation,
      lastMonthPosts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    next(error);
  }
};


const getPostBySlug = async (req, res, next) => {
  try {
    const { slug } = req.query;  // Or use req.params if using dynamic routes
    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Fetching the post by slug
    const result = await query('SELECT * FROM posts WHERE slug = $1 LIMIT 1', [slug]);
    const post = result.rows[0];

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    next(error);
  }
};



// 3. READ - Get a single post by ID
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM posts WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found!' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching post by id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. UPDATE - Update a post
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, content, category, images, location, post_status, expires, days_listed, price } = req.body;

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
      'UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content), slug = $3, category = COALESCE($4, category), images = COALESCE($5, images), location = COALESCE($6, location), post_status = COALESCE($7, post_status), expires = COALESCE($8, expires), days_listed = COALESCE($9, days_listed), price = COALESCE($10, price) WHERE id = $11 RETURNING *',
      [title, content, slug, category, images, location, post_status, expires, days_listed, price, id]
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
const deletePost = async (req, res) => {
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

module.exports = { createPost, getAllPosts, getPostById, updatePost, deletePost }
