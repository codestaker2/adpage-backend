const express = require("express");
const multer = require("multer");
const path = require("path");
const { query } = require("../db");
const fs = require("fs");

const router = express.Router();

// Ensure uploads directories exist for avatars and posts
const pathToAvatars = "/avatars";
const pathToPosts = "/posts";

if (!fs.existsSync(pathToAvatars)) {
  fs.mkdirSync(pathToAvatars, { recursive: true });
}
if (!fs.existsSync(pathToPosts)) {
  fs.mkdirSync(pathToPosts, { recursive: true });
}

// Configure storage for avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pathToAvatars); // Destination folder for avatars
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Unique file name
  },
});

// Configure storage for post image upload
const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pathToPosts); // Destination folder for post images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Unique file name
  },
});

// File filter for images (same for both avatar and post images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedTypes.test(file.mimetype);
  if (extname && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed!"), false);
  }
};

// Multer setup for avatar upload
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Multer setup for post image upload
const uploadPostImage = multer({
  storage: postImageStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST route for uploading avatar
router.post("/avatar", uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    const filePath = `https://letspunt.xyz/api/uploads/avatars/${req.file.filename}`;

    // Update the database with the avatar URL
    const result = await query(
      "UPDATE users SET profilepicture = $1 WHERE email = $2 RETURNING *",
      [filePath, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({
      message: "Avatar uploaded successfully!",
      filePath: filePath,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST route for uploading post image
router.post("/posts", (req, res) => {
  //console.log(req.files);
});

module.exports = router;
