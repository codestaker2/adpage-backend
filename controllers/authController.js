const { query } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Signup Route (CREATE user)
const signup = async (req, res) => {
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
        console.log(`New Account created - User: ${newUser.email}`)
        res.status(201).json({
            message: 'User created successfully',
            user: { id: newUser.id, username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        console.log(`Sign up failed - User: ${newUser.email}`)
        res.status(500).json({ error: 'Server error' });
    }
}

const signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || email ==='' || password === '') {
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

    const { password: pass, ...rest } = user;

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isadmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Set JWT as a cookie
    return res.status(200).cookie('access_token', token, {
	httpOnly: true,  // Ensures cookie is not accessible via JavaScript
    	secure: process.env.NODE_ENV === 'production',  // Use only in HTTPS in production
	sameSite: 'Strict',  // Helps mitigate CSRF attacks
	maxAge: 3600000,  // 1 hour expiration time for the token
    }).json({ id: user.id, username: user.username, email: user.email, profilePicture: user.profilepicture, createdAt: user.created_at, updatedAt: user.updated_at, isAdmin: user.isadmin, token });
   console.log(`Sign in successful - User: ${user.email}`)

  } catch (err) {
    console.error(err);
    console.log(`Sign in failed - User: ${user.email}`)
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const google = async (req, res) => {
    const {email, username, googlePhotoUrl} = req.body;
    try {
      // Check if the user exists
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if(user) {
        const token = jwt.sign({id: user.id, isAdmin: user.isadmin}, process.env.JWT_SECRET);
        res.status(200).cookie('access_token', token, {
          httpOnly: true,
        }).json({id: user.id, username: user.username, email: user.email, profilePicture: user.profilepicture, token});
      } else {
        const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hashSync(generatedPassword, 10)
        const insertQuery = 'INSERT INTO users(username, email, password, profilepicture) VALUES ($1,$2,$3,$4) RETURNING id, username, email, profilepicture';
        const insertResult = await query(insertQuery, [username, email, hashedPassword, googlePhotoUrl]);
        const newUser = insertResult.rows[0];
        console.log(`New user registered: ${email}`, newUser);
        //Respond with newly created user
        // Generate JWT token for the new user
        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET);

        // Respond with the newly created user and the JWT token
        return res.status(200).cookie('access_token', token, {
             httpOnly: true,  // Ensures cookie is not accessible via JavaScript
             secure: process.env.NODE_ENV === 'production',  // Use only in HTTPS in production
             sameSite: 'Strict',  // Helps mitigate CSRF attacks
             maxAge: 3600000,  // 1 hour expiration time for the token
          }).json({ id: newUser.id, username: newUser.username, email: newUser.email, profilePicture: newUser.profilepicture, token });
      } 
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({error: 'Server error'});
    }
}

module.exports = { signin, signup, google }
