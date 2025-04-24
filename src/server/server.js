// Import the necessary modules
require('dotenv').config({ path: '../../server.env' });
const cors = require('cors');
const fs = require('fs');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const multer = require('multer');
const port = process.env.PORT || 5000;
const express = require("express");
const signupRoute = require("./routes/signup"); // 🔗 Import the signup logic
const { sql, poolPromise } = require('./db.js');

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

app.post('/uploadFile', upload.array('files'), async (req, res) => {
  try {
    // Azure Blob Storage configuration
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    // Create the BlobServiceClient
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`, 
      credential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Upload files and collect results
    const uploadResults = [];
    for (const file of req.files) {
      // Create a unique blob name
      const blobName = `${Date.now()}-${file.originalname}`;
      
      // Upload to Azure Blob Storage
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.uploadFile(file.path);
      
      // Store result info
      uploadResults.push({
        originalName: file.originalname,
        encryptedName: blobName,
        blobUrl: blobClient.url
      });
      
      // Clean up local file after upload
      fs.unlinkSync(file.path);
    }
    
    res.json({ 
      success: true,
      message: `Files uploaded successfully to Azure`,
      files: uploadResults
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading files', 
      error: error.message 
    });
  }
});

// Save encryption data
app.post('/saveEncryptionData', async (req, res) => {
  try {
    console.log('Received encryption data:', req.body);
    
    const { 
      fileName,
      originalName, 
      blobUrl, 
      encryptionKey, 
      iv, 
      userId
      // departmentId is no longer needed from request body
    } = req.body;
    
    // Always use constant department ID
    const departmentId = 1; // Constant department ID
    
    // Get pool connection
    const pool = await poolPromise;
    
    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // 1. Insert file record with constant department ID
      const fileResult = await transaction.request()
        .input('nom_fichier', sql.NVarChar, originalName)
        .input('chemin_stockage', sql.NVarChar, blobUrl)
        .input('cree_par', sql.Int, userId)
        .input('date_creation', sql.DateTime, new Date())
        .input('id_sous_departement', sql.Int, departmentId) // Always use constant value 1
        .query(`
          INSERT INTO dbo.Fichier (nom_fichier, chemin_stockage, cree_par, date_creation, id_sous_departement)
          OUTPUT INSERTED.id_fichier
          VALUES (@nom_fichier, @chemin_stockage, @cree_par, @date_creation, @id_sous_departement)
        `);
      
      const fileId = fileResult.recordset[0].id_fichier;
      
      // 2. Insert encryption key record - Store encryption key and IV in hash_blockchain field
      const encryptionData = JSON.stringify({
        key: encryptionKey,
        iv: iv
      });
      
      await transaction.request()
        .input('id_fichier', sql.Int, fileId)
        .input('hash_blockchain', sql.NVarChar, encryptionData)
        .input('algo', sql.NVarChar, 'AES-GCM')
        .input('date_creation', sql.DateTime, new Date())
        .input('statut', sql.NVarChar, 'active')
        .query(`
          INSERT INTO dbo.EncryptionKey (id_fichier, hash_blockchain, algo, date_creation, statut)
          VALUES (@id_fichier, @hash_blockchain, @algo, @date_creation, @statut)
        `);
      
      // Commit transaction
      await transaction.commit();
      
      // Also save encryption keys to the in-memory store as a backup
      try {
        const encryptionDataForMemory = [{
          fileName: originalName,
          key: encryptionKey,
          iv: iv
        }];
        
        await fetch("http://localhost:5000/saveKeys", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ encryptionData: encryptionDataForMemory })
        });
      } catch (keyError) {
        console.warn('Failed to save keys to memory store:', keyError);
        // Continue anyway since we stored them in the database
      }
      
      res.json({ 
        success: true, 
        message: 'File and encryption data saved successfully', 
        fileId 
      });
    } catch (err) {
      // If error, rollback transaction
      console.error('Transaction error:', err);
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error saving encryption data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error saving encryption data', 
      error: error.message 
    });
  }
});
// Also modify the getFile endpoint to extract encryption data from hash_blockchain
app.get('/getFile/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // Get pool connection
    const pool = await poolPromise;
    
    // Query to get file and encryption data
    const result = await pool.request()
      .input('fileId', sql.Int, fileId)
      .query(`
        SELECT 
          f.id_fichier,
          f.nom_fichier,
          f.chemin_stockage,
          k.hash_blockchain,
          k.algo
        FROM dbo.Fichier f
        JOIN dbo.EncryptionKey k ON f.id_fichier = k.id_fichier
        WHERE f.id_fichier = @fileId AND k.statut = 'active'
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const fileData = result.recordset[0];
    
    // Parse the encryption data from hash_blockchain
    let encryptionData = { key: '', iv: '' };
    try {
      if (fileData.hash_blockchain.startsWith('{')) {
        encryptionData = JSON.parse(fileData.hash_blockchain);
      }
    } catch (e) {
      console.warn('Failed to parse encryption data from hash_blockchain:', e);
    }
    
    res.json({
      id: fileData.id_fichier,
      fileName: fileData.nom_fichier,
      blobUrl: fileData.chemin_stockage,
      encryptionData: {
        key: encryptionData.key || '',
        iv: encryptionData.iv || '',
        algorithm: fileData.algo
      }
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ 
      message: 'Error retrieving file', 
      error: error.message 
    });
  }
});
// Get all files for a user
app.get('/getUserFiles/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get pool connection
    const pool = await poolPromise;
    
    // Query to get all files for user
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          f.id_fichier,
          f.nom_fichier,
          f.date_creation
        FROM dbo.Fichier f
        WHERE f.cree_par = @userId
        ORDER BY f.date_creation DESC
      `);
    
    res.json({
      success: true,
      files: result.recordset
    });
  } catch (error) {
    console.error('Error retrieving user files:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving user files', 
      error: error.message 
    });
  }
});
// Add this to your backend Express app

// In-memory storage (replace with database for production)
const encryptionKeys = {};

app.post('/saveKeys', express.json(), async (req, res) => {
  try {
    const { encryptionData } = req.body;
    
    // For each file's encryption data, store the keys
    encryptionData.forEach(data => {
      encryptionKeys[data.fileName] = {
        key: data.key,
        iv: data.iv
      };
    });
    
    // In production, you would save these to a secure database
    res.json({ message: 'Encryption keys saved successfully' });
  } catch (error) {
    console.error('Error saving encryption keys:', error);
    res.status(500).json({ message: 'Error saving encryption keys', error: error.message });
  }
});

// Add an endpoint to retrieve keys for decryption
app.get('/getKey/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!encryptionKeys[fileName]) {
      return res.status(404).json({ message: 'Encryption key not found' });
    }
    
    res.json({ 
      key: encryptionKeys[fileName].key,
      iv: encryptionKeys[fileName].iv
    });
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    res.status(500).json({ message: 'Error retrieving encryption key', error: error.message });
  }
});



















app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
const loginRoute = require("./routes/login"); // 👈 Import login route
app.use("/api", loginRoute); // 👈 Mount the login route

