// Import the necessary modules
require('dotenv').config({ path: '../../server.env' });
const cors = require('cors');
const fs = require('fs');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const multer = require('multer');
const express = require("express");
const signupRoute = require("./routes/signup"); // 🔗 Import the signup logic


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'], // Only allow requests from your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/uploadFile', upload.single('file'), async (req, res) => {
  try {
    // Azure Blob Storage configuration
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    console.log("accountName:", accountName);
console.log("accountKey:", accountKey);
    // Create the BlobServiceClient using the Storage Account Key
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`, 
      credential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Upload the file
    const blobClient = containerClient.getBlockBlobClient(req.file.originalname);
    const uploadBlobResponse = await blobClient.uploadFile(req.file.path);
    
    res.json({ message: `File uploaded successfully: ${req.file.originalname}` });
 
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    res.status(500).json({ message: 'Error retrieving encryption key', error: error.message });
  }
});



















// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred", message: err.message });
});

// Start the server (only once)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});