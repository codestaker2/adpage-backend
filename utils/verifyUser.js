// verifyUser.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers['authorization']; // Assuming token is passed in the Authorization header

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // Split the token string and get the actual token part (after 'Bearer ')
  const tokenPart = token.split(' ')[1];  // "Bearer <token>"

  if (!tokenPart) {
    return res.status(403).json({ message: 'Invalid token format' });
  }

  jwt.verify(tokenPart, process.env.JWT_SECRET, (err, decoded) => {
   if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    req.user = decoded; // Attach the decoded JWT payload to `req.user`

    // Now, check if the user is an admin or if the user is the owner of the account
    const targetUserId = parseInt(req.params.userId); // Assuming the target user's ID is in the route params

    // Check if user is admin or if they are trying to access their own account
    if (req.user.isAdmin || req.user.id === targetUserId) {
      return next(); // Proceed if the user is an admin or the owner of the account
    } else {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
  });
}

module.exports = { verifyToken };

