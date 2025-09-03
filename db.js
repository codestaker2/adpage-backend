// db.js
const { Pool } = require('pg');

// Database connection pool setup
const pool = new Pool({
  user: 'adpage', // your PostgreSQL username
  host: 'localhost', // database server, 'localhost' if running locally
  database: 'adpage', // your database name
  password: 'aA12131415aA', // your database password
  port: 5432, // default PostgreSQL port
});

// Function to query the database
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = { query };

