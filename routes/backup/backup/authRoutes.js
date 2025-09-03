const express = require('express');
const { query } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Signup Route (CREATE user)
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if all fields are provided
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if the user already exists
        const result = await query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);

        if (result.rows.length > 0) {
            return res.status(400).json({ error: 'Email or username already in use' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const insertQuery = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email';
        const insertResult = await query(insertQuery, [username, email, hashedPassword]);

        const newUser = insertResult.rows[0];

        // Respond with the newly created user
        res.status(201).json({
            message: 'User created successfully',
            user: { id: newUser.id, username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Query the database for the user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    // Check if the user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set JWT as a cookie
    res.cookie('authToken', token, {
      httpOnly: true,  // Ensures cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production',  // Use only in HTTPS in production
      sameSite: 'Strict',  // Helps mitigate CSRF attacks
      maxAge: 3600000,  // 1 hour expiration time for the token
    });

    // Send back the token
    return res.json({ message: 'Sign-in successful', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

