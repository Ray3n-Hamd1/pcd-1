// Updated server.js with fixed queries
// Import the necessary modules
require('dotenv').config({ path: '../../server.env' });
const cors = require('cors');
const fs = require('fs');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const multer = require('multer');
const express = require("express");
const signupRoute = require("./routes/signup"); // 🔗 Import the signup logic
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { sql, poolPromise } = require("./db");

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

// Configure multer for file uploads (in-memory storage for encrypted files)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// File upload endpoints
app.post('/uploadFile', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Azure Blob Storage configuration
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    console.log("Processing upload for", req.files.length, "files");

    // Create the BlobServiceClient using the Storage Account Key
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`, 
      credential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists();

    const uploadResults = [];

    // Process each file
    for (const file of req.files) {
      // Generate unique blob name with UUID
      const blobName = `${uuidv4()}-${file.originalname}`;
      
      // Get block blob client
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      // Upload file from buffer
      await blockBlobClient.upload(file.buffer, file.buffer.length, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      });
      
      // Get blob URL
      const blobUrl = blockBlobClient.url;
      
      uploadResults.push({
        originalName: file.originalname,
        encryptedName: blobName,
        blobUrl: blobUrl,
        size: file.size
      });
      
      console.log(`Uploaded: ${file.originalname} as ${blobName}`);
    }

    res.status(200).json({ 
      message: 'Files uploaded successfully',
      files: uploadResults
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Error uploading files to Azure', details: error.message });
  }
});

// Save encryption data endpoint
app.post('/saveEncryptionData', async (req, res) => {
  try {
    const { 
      fileName, 
      originalName, 
      blobUrl, 
      encryptionKey, 
      iv, 
      userId, 
      sousDepId 
    } = req.body;

    console.log("Saving encryption data for:", originalName);

    if (!fileName || !originalName || !blobUrl || !encryptionKey || !iv || !userId || !sousDepId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'All fields including sousDepId are required'
      });
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // 1. Insert file record with sous-department reference
      const insertFileResult = await transaction.request()
        .input("nom_fichier", sql.VarChar, originalName)
        .input("chemin_stockage", sql.VarChar, blobUrl)
        .input("cree_par", sql.Int, userId)
        .input("date_creation", sql.DateTime, new Date())
        .input("id_sous_departement", sql.Int, sousDepId)
        .query(`
          INSERT INTO dbo.Fichier 
          (nom_fichier, chemin_stockage, cree_par, date_creation, id_sous_departement) 
          OUTPUT INSERTED.id_fichier
          VALUES (@nom_fichier, @chemin_stockage, @cree_par, @date_creation, @id_sous_departement)
        `);
      
      const fileId = insertFileResult.recordset[0].id_fichier;
      
      // 2. Insert encryption key record with the correct column names from your database
      await transaction.request()
        .input("id_fichier", sql.Int, fileId)
        .input("hash_blockchain", sql.VarChar, encryptionKey)
        .input("algo", sql.VarChar, iv)
        .input("statut", sql.VarChar, "active")
        .input("date_creation", sql.DateTime, new Date())
        .query(`
          INSERT INTO dbo.EncryptionKey 
          (id_fichier, hash_blockchain, algo, statut, date_creation) 
          VALUES (@id_fichier, @hash_blockchain, @algo, @statut, @date_creation)
        `);
      
      await transaction.commit();
      
      console.log("Encryption data saved successfully for file ID:", fileId);
      
      res.status(201).json({ 
        message: 'File and encryption data saved successfully',
        fileId: fileId
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Database error:', error);
      res.status(500).json({ 
        error: 'Failed to save file data', 
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

// Department-related routes
// Get departments for a superadmin
app.get("/superadmin/:userId/departments", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const pool = await poolPromise;
    
    // SuperAdmin departments
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT d.id_departement, d.nom
        FROM dbo.Departement d
        INNER JOIN dbo.SuperAdmin_Departement sad ON d.id_departement = sad.id_departement
        WHERE sad.id_utilisateur = @userId
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching superadmin departments:", error);
    res.status(500).json({ error: "Error fetching superadmin departments" });
  }
});

// Get departments for an admin - FIXED QUERY
app.get("/admin/:userId/departments", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const pool = await poolPromise;
    
    // Fixed query - no DISTINCT with text data type
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT d.id_departement, d.nom
        FROM dbo.Departement d
        INNER JOIN dbo.SousDepartement sd ON d.id_departement = sd.id_departement
        INNER JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
        WHERE asd.id_utilisateur = @userId
        GROUP BY d.id_departement, d.nom
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching admin departments:", error);
    res.status(500).json({ error: "Error fetching admin departments" });
  }
});

// Get departments for a regular user - FIXED QUERY
app.get("/user/:userId/departments", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const pool = await poolPromise;
    
    // Fixed query - no DISTINCT with text data type
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT d.id_departement, d.nom
        FROM dbo.Departement d
        INNER JOIN dbo.SousDepartement sd ON d.id_departement = sd.id_departement
        INNER JOIN dbo.User_SousDepartement usd ON sd.id_sous_departement = usd.id_sous_departement
        WHERE usd.id_utilisateur = @userId
        GROUP BY d.id_departement, d.nom
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching user departments:", error);
    res.status(500).json({ error: "Error fetching user departments" });
  }
});

// Route to get sous-departments for a department
app.get("/departments/:departmentId/sousdepartments", async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    if (!departmentId) {
      return res.status(400).json({ error: "Invalid department ID" });
    }
    
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("departmentId", sql.Int, departmentId)
      .query(`
        SELECT id_sous_departement, nom, id_departement
        FROM dbo.SousDepartement
        WHERE id_departement = @departmentId
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching sous-departments:", error);
    res.status(500).json({ error: "Error fetching sous-departments" });
  }
});

// Import routes
const departementsRoute = require("./routes/departements");
const joinRequestRoute = require("./routes/joinRequest");
const loginRoute = require("./routes/login");

// Mount routes - FIX: Mount directly to /api to match the route file structure
app.use(departementsRoute); // instead of app.use("/api", departementsRoute);
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