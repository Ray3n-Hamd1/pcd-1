// Import the necessary modules
require('dotenv').config({ path: 'C:/Users/rayen/OneDrive/Documents/GitHub/pcd/server.env' });
const cors = require('cors');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const multer = require('multer');
const port = process.env.PORT || 5000;
const express = require("express");
const signupRoute = require("./routes/signup"); // 🔗 Import the signup logic


const app = express();
app.use(cors()); // Allows frontend to talk to backend
app.use(express.json()); // Lets us use JSON in requests

app.use("/api", signupRoute); // 👈 Route for /api/signup

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Enable CORS for all origins (or restrict it to specific origins)
app.use(cors({
  origin: ['http://localhost:5173'], // Only allow requests from your frontend (you can specify more origins)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/uploadFile', upload.single('file'), async (req, res) => {
  try {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    console.log("accountName:", accountName);
console.log("accountKey:", accountKey);
    // Create the BlobServiceClient using the Storage Account Key
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Upload the file
    const blobClient = containerClient.getBlockBlobClient(req.file.originalname);
    const uploadBlobResponse = await blobClient.uploadFile(req.file.path);
    
    res.json({ message: `File uploaded successfully: ${req.file.originalname}` });
 
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
const loginRoute = require("./routes/login"); // 👈 Import login route
app.use("/api", loginRoute); // 👈 Mount the login route

