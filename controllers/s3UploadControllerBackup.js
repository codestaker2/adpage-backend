const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Step 2: The s3Client function validates your request and directs it to your Space's specified endpoint using the AWS SDK.


const s3Client = new S3Client({
  endpoint: "https://syd1.digitaloceanspaces.com",
  forcePathStyle: false,
  region: "syd1",
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY_ID,
    secretAccessKey: process.env.DO_ACCESS_SECRET_KEY
  }
});
// Define the upload route
const s3Upload = async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Prepare parameters for the S3 upload
  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;
  const fileExtension = path.extname(fileName).toLowerCase();
  const folderPath = 'posts';

  // Set content type dynamically based on file extension
  let contentType = 'image/*';

  const params = {
    Bucket: process.env.DO_BUCKET,
    Key: `${folderPath}/${fileName}`,
    Body: fileBuffer,
    ACL: 'public-read',
    ContentType: contentType,
  };

  try {
    // Upload the image to DigitalOcean Space
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log(`Successfully uploaded object: ${params.Bucket}/${params.Key}`);

    // Send a response back with the URL of the uploaded file (public or private link)
    const fileUrl = `https://666.syd1.digitaloceanspaces.com/${params.Key}`;
    res.json({ message: 'File uploaded successfully', fileUrl: fileUrl });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Error uploading file' });
  }
}

module.exports = { s3Upload }
