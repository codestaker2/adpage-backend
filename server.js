// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
//const morgan = require('morgan');
const port = 5000;

const dotenv = require("dotenv");
dotenv.config();

const { query } = require("./db");

const app = express();

const postsRoutes = require("./routes/postsRoutes");
const authRoutes = require("./routes/authRoutes");
const searchRoutes = require("./routes/searchRoutes");
// const fileUploadRoutes = require("./routes/fileUploadRoutes");
const userRoutes = require("./routes/userRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const s3UploadRoute = require("./routes/s3UploadRoute");
const filteredPostsRoute = require("./routes/filteredPosts");

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "https://special-rotary-phone-g44w5j7g5xv5hp756-5173.app.github.dev",
  "https://improved-umbrella-4jvw459g9wg625pq-5173.app.github.dev",
  "https://special-rotary-phone-g44w5j7g5xv5hp756-5174.app.github.dev",
  "https://improved-umbrella-4jvw459g9wg625pq-5174.app.github.dev",
  "https://potential-space-train-r44vrqpjrgrpcwqjr-5173.app.github.dev",
  "https://potential-space-train-r44vrqpjrgrpcwqjr-5174.app.github.dev",
];

app.use(
  cors({
    origin: allowedOrigins, // Allow specific origin
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"], // Allow Authorization header
    credentials: true,
  })
);

//Static routes
// Serve static files from the "api/uploads/avatars" folder
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads", "avatars"))
);
//app.use('/uploads/posts', express.static(path.join(__dirname, 'uploads', 'posts')));

// Setup logging with timestamps
//app.use(morgan(':date[web] :method :url :status :response-time ms'));

// Endpoint to store the transaction
app.post("/store-transaction", async (req, res) => {
  const { bch_address, txid, user_id, amount, description, post_id } = req.body;
  console.log("req.body", req.body);
  if (
    !bch_address ||
    !txid ||
    !user_id ||
    !amount ||
    !description ||
    !post_id
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const sql = `
      INSERT INTO transactions (bch_address, txid, user_id, amount, description, post_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (txid) DO NOTHING;
    `;
    await query(sql, [
      bch_address,
      txid,
      user_id,
      amount,
      description,
      post_id,
    ]);
    res.status(201).json({ message: "Transaction stored successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store transaction" });
  }
});

// Fetch the logged in users transactions
app.post("/user-transactions", async (req, res) => {
  const { userId } = req.body;
  console.log("req.params", req.params);
  console.log("req.body", req.body);
  console.log("userId", userId);
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const sql = `SELECT * FROM transactions WHERE user_id = $1;`;

    result = await query(sql, [userId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user transactions" });
  }
});

// User updated email address
app.patch("/change-email", async (req, res) => {
  const { newEmail, userId } = req.body;
  //const {userId} = req.user;
  console.log("newEmail", newEmail);
  console.log("userId", userId);

  if (!newEmail) {
    return res.status(400).json({ error: "New email is required" });
  }

  try {
    const sql = `UPDATE users SET email = COALESCE($1, email) WHERE id = $2 RETURNING *`;

    result = await query(sql, [newEmail, userId]);

    res.status(200).json(result.row);
  } catch (err) {
    console.error(err);
  }
});

// User updated email address
app.patch("/change-password", async (req, res) => {
  const { newPassword, userId } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  // Hash the password
  const hashedPassword = await bcryptjs.hash(newPassword, 10);

  try {
    const sql = `UPDATE users SET password = COALESCE($1, password) WHERE id = $2 RETURNING *`;

    result = await query(sql, [hashedPassword, userId]);

    res.status(200).json(result.row);
  } catch (err) {
    console.error(err);
  }
});

//Routes
app.use("/posts", postsRoutes);
app.use("/auth", authRoutes);
app.use("/search", searchRoutes);
// app.use('/upload', fileUploadRoutes)
app.use("/users", userRoutes);
app.use("/comments", commentsRoutes);
app.use("/s3", s3UploadRoute);
app.use("/filteredposts", filteredPostsRoute);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
