const { query } = require('../db');

// DELETE endpoint to remove image from a post
const deleteImage = async (req, res) => {
  const { id, imageUrl } = req.body;  // The postId and imageUrl to be deleted
  console.log(req.body);
  console.log(req.params)
  if (!id || !imageUrl) {
    return res.status(400).json({ message: 'Post ID and image URL are required' });
  }

  try {
    // Delete the image URL from the database (remove from the post's images array)
    const sql = `
      UPDATE posts
      SET images = array_remove(images, $1)
      WHERE id = $2
      RETURNING images;
    `;
    const values = [imageUrl, id];

    const result = await query(sql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found or image not associated with this post' });
    }

    res.status(200).json({
      message: 'Image deleted successfully',
      remainingImages: result.rows[0].images,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Failed to delete image. Please try again.' });
  }
};

module.exports = { deleteImage };
