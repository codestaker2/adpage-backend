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
  // Use multer to handle file uploads first

    // If no files are uploaded
//    if (!req.files || req.files.length === 0) {
  //    return res.status(400).json({ error: 'No files uploaded' });
   // }

    // Array to store the URLs of the uploaded files
    const uploadedFileUrls = [];

    // Iterate over each file in the request and upload it to DigitalOcean Spaces
    for (const file of req.files) {
      const fileBuffer = file.buffer;
      const fileName = file.originalname;
      const folderPath = 'posts'; // Folder name where you want to store the files

      // Set content type dynamically based on file extension
      const fileExtension = path.extname(fileName).toLowerCase();
      const contentType = fileExtension === '.jpg' || fileExtension === '.jpeg' 
                          ? 'image/jpeg' 
                          : 'image/png'; // Extend this as needed for other formats

      // Define the S3 upload parameters for each file
      const params = {
        Bucket: "666",
        Key: `${folderPath}/${Date.now()}-${fileName}`, // Adding timestamp to ensure uniqueness
        Body: fileBuffer,
        ACL: 'public-read',
        ContentType: contentType,
      };

      try {
        // Upload the image to DigitalOcean Space
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log(`Successfully uploaded object: ${params.Bucket}/${params.Key}`);

        // Construct the public URL for the uploaded file
        const fileUrl = `https://${process.env.DO_BUCKET}.${process.env.DO_ENDPOINT}/${params.Key}`;
        uploadedFileUrls.push(fileUrl); // Push the file URL to the array
      } catch (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({ error: 'Error uploading file', details: err.message });
      }
    }

    // Send a response with all the uploaded file URLs
    res.json({ message: 'Files uploaded successfully', fileUrls: uploadedFileUrls });
  }

module.exports = { s3Upload };
