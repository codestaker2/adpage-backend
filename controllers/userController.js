const bcryptjs = require('bcryptjs');
const { errorHandler } = require('../utils/error');
const { query } = require('../db');

const getUsers = async (req, res) => {
  const startIndex = parseInt(req.query.startIndex) || 0;
  const limit = 9; // number of users per page


  try {
    // Query to get all users
    const result = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, startIndex]);

    const users = result.rows;

    // Getting the total number of users
    const totalUsersResult = await query('SELECT COUNT(*) FROM users', []);
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Getting the number of users created within the last month
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const lastMonthUsersResult = await query(
      'SELECT COUNT(*) FROM users WHERE created_at >= $1',
      [oneMonthAgo]
    );
    const lastMonthUsers = parseInt(lastMonthUsersResult.rows[0].count);


    // Send the response with the users list
    res.status(200).json({
      users,
      totalUsers,
      lastMonthUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const getUser = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from the URL parameter

    //const userId = parseInt(req.params.userId); // Get userId from params and convert to integer

    // Query to get one user by ID
    const result = await query('SELECT id, username, email, profilepicture, created_at, updated_at, isadmin FROM users WHERE id = $1', [id]);

    // Check if the user exists
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the response with the user details
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const updateUser = async (req, res, next) => {
  const { username, email, password, profilePicture, isAdmin } = req.body;
  // Check if the user is trying to update their own details
  if (!req.user.isAdmin && req.user.id !== parseInt(req.params.userId)) {
    return next(errorHandler(403, `${req.user.email} with id: ${req.user.id} attempted to update the profile of user id: ${req.params.userId}`));
  }

  // Check if the user is attempting to update `isAdmin` field
  if (typeof isAdmin !== 'undefined') {
    // Ensure the current user has `isAdmin: true` before allowing update of `isAdmin`
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only an admin can update the isAdmin field' });
    }
  }

  // Validate and hash password if provided
  if (password) {
    if (password.length < 6) {
      //return next(errorHandler(400, 'Password must be at least 6 characters in length'));
      return res.status(400).json({ message: 'Password must be at least 6 characters in length'});
    }
    req.body.password = bcryptjs.hashSync(password, 10);
  }

  // Validate username if provided
  if (username) {
    if (username.length < 7 || username.length > 20) {
      // return next(errorHandler(400, 'Username must be between 7 and 20 characters'));
      return res.status(400).json({ message: 'Username must be between 7 and 20 characters' });
    }
    if (username.includes(' ')) {
      // return next(errorHandler(400, 'Username cannot contain spaces'));
      return res.status(400).json({ message: 'Username cannot contain spaces'});
    }
    if (username !== username.toLowerCase()) {
      // return next(errorHandler(400, 'Username must be lowercase'));
      return res.status(400).json({ message: 'Username must be lowercase'});
    }
    if (!username.match(/^[a-zA-Z0-9]+$/)) {
      // return next(errorHandler(400, 'Username can only contain letters and numbers'));
      return res.status(400).json({ message: 'Username must be lowercase'});
    }
  }

  // Build the UPDATE query dynamically
  const values = [];
  let setClause = 'SET';

  if (username) {
    setClause += ` username = $${values.length + 1}`;
    values.push(username);
  }
  if (email) {
    setClause += `${values.length > 0 ? ',' : ''} email = $${values.length + 1}`;
    values.push(email);
  }
  if (password) {
    setClause += `${values.length > 0 ? ',' : ''} password = $${values.length + 1}`;
    values.push(req.body.password);
  }
  if (profilePicture) {
    setClause += `${values.length > 0 ? ',' : ''} profilepicture = $${values.length + 1}`;
    values.push(profilePicture); // Add the profilePicture to the query
  }
  if (typeof isAdmin !== 'undefined') {
    setClause += `${values.length > 0 ? ',' : ''} isAdmin = $${values.length + 1}`;
    values.push(isAdmin); // Add the isAdmin to the query
  }


  // If no valid fields provided for update, return an error
  if (values.length === 0) {
    return next(errorHandler(400, 'No fields provided to update.'));
  }

  const q = `
    UPDATE users
    ${setClause}
    WHERE id = $${values.length + 1}
    RETURNING *;
  `;

  const userToBeUpdated = parseInt(req.params.userId)
  values.push(userToBeUpdated); // Append the userId as the last value for the WHERE clause

  try {
    const result = await query(q, values);

    if (result.rows.length > 0) {
      const { id, username, email, password, profilepicture: profilePicture, isadmin, created_at, updated_at } = result.rows[0];
      console.log(`user ID: ${req.params.userId} info was updated`, {id, username, email, profilePicture, isAdmin, created_at, updated_at})
      res.status(200).json({ id, username, email, password, profilePicture, isAdmin, created_at, updated_at });
    } else {
      console.log('No user found with that userId.');
      return next(errorHandler(404, 'User not found.'));
    }
  } catch (error) {
    console.error('Error updating user details:', error);
    //return next(errorHandler(500, 'Error updating user details'));
    res.status(500).json({ message: error.detail });
  }
};

const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
    const userEmail = req.user.email;

    if (result.rows.length > 0) {
      console.log(`User: ${result.rows[0].email} deleted their account:`, result.rows[0]); // Log the deleted user (optional)
      return res.status(200).json({ message: `User: ${userEmail} has successfully deleted their account` }); // Respond with success
    } else {
      // If no rows are affected, return a message that the user wasn't found
      console.log(`${userEmail} attempted to delete their account, but it was not found`)
      return res.status(404).json({ message: `User: ${userEmail} was not found` });
    }
  } catch (error) {
    console.error(`Error deleting User: ${userEmail}`, error); // Log any errors
    return next(error); // Pass the error to the error handler middleware
  }
};

const signout = async (req, res, next) => {
  const { email } = req.body;
  try {
    res.clearCookie('access_token').status(200).json('User has been signed out');
    console.log(`Sign out successful - User: ${email}`);
  } catch(error) {
    next(error);
  }
}

module.exports = { getUsers, getUser, updateUser, deleteUser, signout };
