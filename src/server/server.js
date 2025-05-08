// Updated server.js with fixed queries
// Import the necessary modules
import dotenv from 'dotenv';
dotenv.config({ path: '../../server.env' });
import cors from 'cors';
import fs from 'fs';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import multer from 'multer';
import express from 'express';
import signupRoute from './routes/signup.js';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { sql, poolPromise } from './db.js';
import contract from './contract.js';

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
// Save encryption data endpoint
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
      sousDepId,
      priority, // New priority parameter
      transactionHash
    } = req.body;
    
    console.log("Saving encryption data for:", originalName);
    
    // Validate all required fields except priority (to maintain backward compatibility)
    if (!fileName || !originalName || !blobUrl || !encryptionKey || !iv || !userId || !sousDepId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields including sousDepId are required'
      });
    }
    
    // Set default priority if not provided
    const filePriority = priority || "User";
    
    // Validate priority value if provided
    const validPriorities = ["User", "Admin", "Super Admin"];
    if (priority && !validPriorities.includes(filePriority)) {
      return res.status(400).json({
        error: 'Invalid priority value',
        message: 'Priority must be one of: User, Admin, or Super Admin'
      });
    }
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // 1. Insert file record with sous-department reference and priority
      // Notice the column name is "priorite" in the database (not "priority")
      const insertFileResult = await transaction.request()
        .input("nom_fichier", sql.VarChar, originalName)
        .input("chemin_stockage", sql.VarChar, blobUrl)
        .input("cree_par", sql.Int, userId)
        .input("date_creation", sql.DateTime, new Date())
        .input("id_sous_departement", sql.Int, sousDepId)
        .input("priorite", sql.Int, convertPriorityToInt(filePriority)) // Convert string priority to integer
        .query(`
          INSERT INTO dbo.Fichier 
          (nom_fichier, chemin_stockage, cree_par, date_creation, id_sous_departement, priorite)
          OUTPUT INSERTED.id_fichier
          VALUES (@nom_fichier, @chemin_stockage, @cree_par, @date_creation, @id_sous_departement, @priorite)
        `);
      
      const fileId = insertFileResult.recordset[0].id_fichier;
      
      // 2. Insert encryption key record with the correct column names from your database
      await transaction.request()
        .input("id_fichier", sql.Int, fileId)
        .input("hash_blockchain", sql.VarChar, transactionHash)
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
        fileId: fileId,
        priority: filePriority
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

// Helper function to convert string priority to integer values
// This matches the int type in the database schema
function convertPriorityToInt(priority) {
  switch(priority) {
    case "User":
      return 1;
    case "Admin":
      return 2;
    case "Super Admin":
      return 3;
    default:
      return 1; // Default to User priority
  }
}
// Helper function to convert stream to buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}
//downloading the file
// Improved downloadFile endpoint
app.get('/downloadFile/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(`Download request for file ID: ${fileId}`);
    
    // Get file metadata from database
    const pool = await poolPromise;
    const fileResult = await pool.request()
      .input('fileId', sql.Int, fileId)
      .query(`
        SELECT 
          f.nom_fichier AS fileName, 
          f.chemin_stockage AS blobUrl,
          ek.algo AS iv
        FROM dbo.Fichier f
        JOIN dbo.EncryptionKey ek ON f.id_fichier = ek.id_fichier
        WHERE f.id_fichier = @fileId
      `);

    if (fileResult.recordset.length === 0) {
      console.log(`File not found: ID ${fileId}`);
      return res.status(404).json({ message: 'File not found in database' });
    }

    const fileData = fileResult.recordset[0];
    console.log("File data retrieved:", { 
      fileName: fileData.fileName,
      blobUrl: fileData.blobUrl 
    });

    // Configure Azure storage client
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    if (!containerName || !accountName || !accountKey) {
      console.error("Missing Azure storage configuration");
      return res.status(500).json({ message: 'Server configuration error: Missing Azure storage credentials' });
    }
    
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Improved URL parsing for blob name extraction
    try {
      const url = new URL(fileData.blobUrl);
      console.log("Parsed URL:", {
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname
      });
      
      // More detailed path parsing
      const pathParts = url.pathname.split('/');
      console.log("Path parts:", pathParts);
      
      // The blob name should be the last part of the path
      const blobName = pathParts[pathParts.length - 1];
      console.log("Extracted blob name:", blobName);
      
      if (!blobName) {
        console.error("Failed to extract blob name from URL:", fileData.blobUrl);
        return res.status(500).json({ message: 'Invalid blob URL format' });
      }
      // Add this line to decode the URI components
const decodedBlobName = decodeURIComponent(blobName);
console.log("Decoded blob name:", decodedBlobName);
const blockBlobClient = containerClient.getBlockBlobClient(decodedBlobName);
      
      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        console.error(`Blob ${blobName} does not exist in container ${containerName}`);
        return res.status(404).json({ message: 'File not found in storage' });
      }
      
      // Download the blob
      const downloadResponse = await blockBlobClient.download();
      const blobBody = await streamToBuffer(downloadResponse.readableStreamBody);
      
      // Send file back to client
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=${fileData.fileName}`);
      res.send(blobBody);
    } catch (urlError) {
      console.error("URL parsing error:", urlError);
      
      // Fallback method - try direct blobname extraction
      console.log("Trying fallback blob name extraction...");
      const blobName = fileData.blobUrl.split('/').pop();
      console.log("Fallback extracted blob name:", blobName);
      
      if (!blobName) {
        return res.status(500).json({ message: 'Could not determine blob name from URL' });
      }
      
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Check if blob exists
        const exists = await blockBlobClient.exists();
        if (!exists) {
          console.error(`Blob ${blobName} does not exist in container ${containerName}`);
          return res.status(404).json({ message: 'File not found in storage using fallback method' });
        }
        
        // Download the blob
        const downloadResponse = await blockBlobClient.download();
        const blobBody = await streamToBuffer(downloadResponse.readableStreamBody);
        
        // Send file back to client
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${fileData.fileName}`);
        res.send(blobBody);
      } catch (fallbackError) {
        console.error("Fallback method failed:", fallbackError);
        return res.status(500).json({ 
          message: 'Failed to retrieve file with fallback method',
          details: fallbackError.message
        });
      }
    }
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ 
      message: 'File download error', 
      details: error.message,
      stack: error.stack 
    });
  }
});


//retrieval 
// In server.js, modify the retrieveFile endpoint
app.get('/retrieveFile/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Modified query to explicitly get the IV from algo column
    const pool = await poolPromise;
    const fileResult = await pool.request()
      .input('fileId', sql.Int, fileId)
      .query(`
        SELECT 
          f.nom_fichier AS fileName, 
          f.chemin_stockage AS blobUrl, 
          ek.hash_blockchain AS transactionHash,
          ek.algo AS iv,  /* Explicitly select algo as iv */
          ek.statut AS status
        FROM dbo.Fichier f
        JOIN dbo.EncryptionKey ek ON f.id_fichier = ek.id_fichier
        WHERE f.id_fichier = @fileId
      `);

    // Handle file not found
    if (fileResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'File not found in database',
        fileId: fileId 
      });
    }

    const fileMetadata = fileResult.recordset[0];

    // Add debug logging
    console.log("Retrieved file metadata:", {
      fileName: fileMetadata.fileName,
      hasIV: !!fileMetadata.iv,
      ivValue: fileMetadata.iv
    });

    res.json({
      fileName: fileMetadata.fileName,
      blobUrl: fileMetadata.blobUrl,
      transactionHash: fileMetadata.transactionHash,
      iv: fileMetadata.iv  // Make sure IV is included in response
    });
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ 
      message: 'File retrieval error', 
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
// Add this endpoint to your server.js file
// Add this version of the endpoint to your server.js file
app.get("/files/sousdepartment/:subDepartmentId", async (req, res) => {
  try {
    const { subDepartmentId } = req.params;
    console.log(`Fetching files for sub-department ID: ${subDepartmentId}`);
    
    if (!subDepartmentId || isNaN(parseInt(subDepartmentId))) {
      return res.status(400).json({ error: "Invalid sub-department ID" });
    }
    
    const pool = await poolPromise;
    
    // First, verify if the sub-department exists
    const checkSubDeptResult = await pool.request()
      .input("subDepartmentId", sql.Int, subDepartmentId)
      .query(`
        SELECT id_sous_departement, nom 
        FROM dbo.SousDepartement 
        WHERE id_sous_departement = @subDepartmentId
      `);
      
    if (checkSubDeptResult.recordset.length === 0) {
      console.log(`Sub-department ID ${subDepartmentId} not found`);
      return res.status(404).json({ error: "Sub-department not found" });
    }
    
    console.log(`Sub-department found: ${checkSubDeptResult.recordset[0].nom}`);
    
    // Get the files with a query that matches your database schema
    const result = await pool.request()
      .input("subDepartmentId", sql.Int, subDepartmentId)
      .query(`
        SELECT 
          f.id_fichier,
          f.nom_fichier,
          f.chemin_stockage,
          f.cree_par,
          f.date_creation,
          f.id_sous_departement,
          f.priorite,
          sd.nom AS sous_departement_name,
          d.nom AS departement_name,
          u.nom AS uploaded_by_name,
          ek.hash_blockchain
        FROM dbo.Fichier f
        JOIN dbo.SousDepartement sd ON f.id_sous_departement = sd.id_sous_departement
        JOIN dbo.Departement d ON sd.id_departement = d.id_departement
        JOIN dbo.Utilisateur u ON f.cree_par = u.id_utilisateur
        LEFT JOIN dbo.EncryptionKey ek ON f.id_fichier = ek.id_fichier
        WHERE f.id_sous_departement = @subDepartmentId
        ORDER BY f.date_creation DESC
      `);
    
    console.log(`Retrieved ${result.recordset.length} files`);
    
    // Configure Azure storage client
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Add size information to each file
    const filesWithSize = await Promise.all(result.recordset.map(async (file) => {
      try {
        // Extract blob name from URL
        const url = new URL(file.chemin_stockage);
        const pathParts = url.pathname.split('/');
        const blobName = decodeURIComponent(pathParts[pathParts.length - 1]);
        
        // Get blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Check if blob exists and get properties
        const exists = await blockBlobClient.exists();
        if (exists) {
          const properties = await blockBlobClient.getProperties();
          // Add size in bytes
          file.size = properties.contentLength;
        } else {
          file.size = null; // File not found in storage
        }
      } catch (error) {
        console.warn(`Error getting size for file ${file.id_fichier}:`, error.message);
        file.size = null; // Error getting size
      }
      
      return file;
    }));
    
    if (filesWithSize.length > 0) {
      console.log("Sample file with size:", {
        id: filesWithSize[0].id_fichier,
        name: filesWithSize[0].nom_fichier,
        size: filesWithSize[0].size,
        priority: filesWithSize[0].priorite
      });
    }
    
    res.json(filesWithSize);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ 
      error: "Error fetching files",
      details: error.message
    });
  }
});
// Import routes
import departementRoutes from './routes/departements.js';
import joinRequestRoute from './routes/joinRequest.js';
import loginRoute from './routes/login.js';

// Mount routes - FIX: Mount directly to /api to match the route file structure
app.use(departementRoutes); // instead of app.use("/api", departementsRoute);
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