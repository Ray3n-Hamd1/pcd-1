// Fixed server.js
// Import the necessary modules
require('dotenv').config({ path: '../../server.env' });
const cors = require('cors');
const fs = require('fs');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const multer = require('multer');
const express = require("express");
const signupRoute = require("./routes/signup"); // 🔗 Import the signup logic
const bodyParser = require('body-parser');

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
    console.log("accountName:", accountName); console.log("accountKey:", accountKey);

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

// Import routes
const departementsRoute = require("./routes/departements");
const joinRequestRoute = require("./routes/joinRequest");
const loginRoute = require("./routes/login");

// Mount routes - FIX: Mount directly to /api to match the route file structure
app.use("/api", departementsRoute); // This is the critical fix
app.use("/api", joinRequestRoute); // Assuming joinRequest is also set up like departements
app.use("/api", loginRoute);
app.use("/api", signupRoute);

// Route for debugging - lists all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push(`${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const baseRoute = middleware.regexp.toString()
            .replace('\\^', '')
            .replace('\\/?(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          
          const routePath = baseRoute.replace(/\\/g, '') + handler.route.path;
          const method = Object.keys(handler.route.methods)[0].toUpperCase();
          
          routes.push(`${method} ${routePath}`);
        }
      });
    }
  });
  
  res.json({ routes });
});

// Add a middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Default error handling route (should be after all other routes)
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).send("Not Found");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected error occurred", message: err.message });
});

// Start the server (only once)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});