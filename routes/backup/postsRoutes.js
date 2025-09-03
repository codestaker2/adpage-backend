// routes/posts.js
const express = require('express');
const { query } = require('../db'); // Import the database query function

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM posts');
    res.json(result.rows); // Return all posts as JSON
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Get a single post by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM posts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Post not found');
    }
    res.json(result.rows[0]); // Return post data as JSON
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Create a new post
router.post('/', async (req, res) => {
  const { title, content, username, phone_number } = req.body;

  if (!title || !content || !username) {
    return res.status(400).send('Missing required fields: title, content, username');
  }

  try {
    const result = await query(
      'INSERT INTO posts (title, content, username, phone_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, username, phone_number]
    );
    res.status(201).json(result.rows[0]); // Return the created post
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Update an existing post
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, username, phone_number } = req.body;

  try {
    const result = await query(
      `UPDATE posts SET 
        title = COALESCE($1, title), 
        content = COALESCE($2, content), 
        username = COALESCE($3, username), 
        phone_number = COALESCE($4, phone_number), 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 
      RETURNING *`,
      [title, content, username, phone_number, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Post not found');
    }

    res.json(result.rows[0]); // Return the updated post
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Post not found');
    }
    res.send('Post deleted');
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;

