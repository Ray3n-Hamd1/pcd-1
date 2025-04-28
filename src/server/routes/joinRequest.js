import express from "express";
const router = express.Router();
import { sql, poolPromise } from "../db.js";

// Create a new join request
router.post("/join-requests", async (req, res) => {
  try {
    // Rename id to id_utilisateur for database compatibility
    const { id, id_departement, id_sous_departement, type_demande, statut } = req.body;
    const id_utilisateur = id; // Map the frontend id to database id_utilisateur
    
    // Validate input
    if (!id_utilisateur || !type_demande) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (type_demande !== "department" && type_demande !== "sous_department") {
      return res.status(400).json({ error: "Invalid request type" });
    }
    
    if (type_demande === "department" && !id_departement) {
      return res.status(400).json({ error: "Department ID is required for department join requests" });
    }
    
    if (type_demande === "sous_department" && !id_sous_departement) {
      return res.status(400).json({ error: "Sous-department ID is required for sous-department join requests" });
    }
    
    const pool = await poolPromise;
    
    // Check if a similar pending request already exists
    let checkQuery = "";
    const checkRequest = pool.request()
      .input("id_utilisateur", sql.Int, id_utilisateur)
      .input("statut", sql.VarChar, "pending");
    
    if (type_demande === "department") {
      checkRequest.input("id_departement", sql.Int, id_departement);
      checkQuery = `
        SELECT * FROM dbo.DemandeJoin 
        WHERE id_utilisateur = @id_utilisateur 
        AND id_departement = @id_departement 
        AND type_demande = 'department' 
        AND statut = @statut
      `;
    } else {
      checkRequest.input("id_sous_departement", sql.Int, id_sous_departement);
      checkQuery = `
        SELECT * FROM dbo.DemandeJoin 
        WHERE id_utilisateur = @id_utilisateur 
        AND id_sous_departement = @id_sous_departement 
        AND type_demande = 'sous_department' 
        AND statut = @statut
      `;
    }
    
    const existingRequest = await checkRequest.query(checkQuery);
    
    if (existingRequest.recordset.length > 0) {
      return res.status(400).json({ error: "A similar pending request already exists" });
    }
    
    // Create the query based on whether it's a department or sous-department request
    let insertQuery = "";
    const request = pool.request()
      .input("id_utilisateur", sql.Int, id_utilisateur)
      .input("type_demande", sql.VarChar, type_demande)
      .input("statut", sql.VarChar, statut || "pending");
      
    if (type_demande === "department") {
      request.input("id_departement", sql.Int, id_departement);
      insertQuery = `
        INSERT INTO dbo.DemandeJoin 
        (id_utilisateur, id_departement, id_sous_departement, type_demande, statut, date_demande) 
        OUTPUT INSERTED.* 
        VALUES (@id_utilisateur, @id_departement, NULL, @type_demande, @statut, GETDATE())
      `;
    } else {
      request.input("id_sous_departement", sql.Int, id_sous_departement);
      insertQuery = `
        INSERT INTO dbo.DemandeJoin 
        (id_utilisateur, id_departement, id_sous_departement, type_demande, statut, date_demande) 
        OUTPUT INSERTED.* 
        VALUES (@id_utilisateur, NULL, @id_sous_departement, @type_demande, @statut, GETDATE())
      `;
    }
    
    const result = await request.query(insertQuery);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Error creating join request:", error);
    res.status(500).json({ error: "Error creating join request" });
  }
});

// Update a join request status (approve/reject)
router.put("/join-requests/:requestId", async (req, res) => {
  try {
    console.log("1. Join request approval started for requestId:", req.params.requestId);
    const { requestId } = req.params;
    const { statut } = req.body;
    
    console.log("2. Request status to be set:", statut);
    
    // Validate the status
    if (statut !== "approved" && statut !== "rejected") {
      console.log("3. Invalid status:", statut);
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }
    
    const pool = await poolPromise;
    
    // First get the request details
    console.log("4. Fetching join request details");
    const getRequest = await pool
      .request()
      .input("requestId", sql.Int, requestId)
      .query("SELECT * FROM dbo.DemandeJoin WHERE id_demande = @requestId");
    
    if (getRequest.recordset.length === 0) {
      console.log("5. Join request not found for ID:", requestId);
      return res.status(404).json({ error: "Join request not found" });
    }
    
    const joinRequest = getRequest.recordset[0];
    console.log("6. Join request details:", JSON.stringify(joinRequest));
    
    // Update the request status
    console.log("7. Updating request status to:", statut);
    await pool
      .request()
      .input("requestId", sql.Int, requestId)
      .input("statut", sql.VarChar, statut)
      .query("UPDATE dbo.DemandeJoin SET statut = @statut WHERE id_demande = @requestId");
    
    // If approved, add the relationship to the appropriate table
    if (statut === "approved") {
      console.log("8. Approval path - getting user role");
      // Get user role
      const userRoleResult = await pool
        .request()
        .input("userId", sql.Int, joinRequest.id_utilisateur)
        .query("SELECT role FROM dbo.Utilisateur WHERE id_utilisateur = @userId");
      
      if (userRoleResult.recordset.length === 0) {
        console.log("9. User not found for ID:", joinRequest.id_utilisateur);
        return res.status(404).json({ error: "User not found" });
      }
      
      const userRole = userRoleResult.recordset[0].role;
      console.log("10. User role:", userRole);
      
      if (joinRequest.type_demande === "department") {
        console.log("11. Department join request");
        
        if (userRole === "admin") {
          console.log("12. Processing admin join to department");
          
          try {
            console.log("13. Running SQL to add admin to department");
            // Direct SQL query to get more detailed error information
            const insertResult = await pool
              .request()
              .input("userId", sql.Int, joinRequest.id_utilisateur)
              .input("deptId", sql.Int, joinRequest.id_departement)
              .query(`
                BEGIN TRY
                  BEGIN TRANSACTION;
                  
                  IF NOT EXISTS (SELECT 1 FROM dbo.Admin_Departement 
                                WHERE id_utilisateur = @userId AND id_departement = @deptId)
                  BEGIN
                    INSERT INTO dbo.Admin_Departement (id_utilisateur, id_departement)
                    VALUES (@userId, @deptId);
                    SELECT 'Admin added to department' AS result;
                  END
                  ELSE
                  BEGIN
                    SELECT 'Admin already in department' AS result;
                  END
                  
                  COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                  ROLLBACK TRANSACTION;
                  SELECT 
                    ERROR_NUMBER() AS ErrorNumber,
                    ERROR_STATE() AS ErrorState,
                    ERROR_SEVERITY() AS ErrorSeverity,
                    ERROR_PROCEDURE() AS ErrorProcedure,
                    ERROR_LINE() AS ErrorLine,
                    ERROR_MESSAGE() AS ErrorMessage;
                END CATCH;
              `);
            
            console.log("14. Database operation completed", insertResult.recordset);
            
            // Verify it was actually inserted
            const verifyInsert = await pool
              .request()
              .input("userId", sql.Int, joinRequest.id_utilisateur)
              .input("deptId", sql.Int, joinRequest.id_departement)
              .query(`SELECT * FROM dbo.Admin_Departement WHERE id_utilisateur = @userId AND id_departement = @deptId`);
            
            console.log("15. Verification result:", verifyInsert.recordset);
            
            if (verifyInsert.recordset.length === 0) {
              console.log("16. WARNING: Admin was not added to the department table!");
            } else {
              console.log("16. CONFIRMED: Admin was successfully added to the department table.");
            }
          } catch (insertError) {
            console.error("17. Error adding admin to department:", insertError);
            return res.status(500).json({ error: "Error adding admin to department", details: insertError.message });
          }
        } else if (userRole === "superadmin") {
          // Code for superadmin joining a department
          await pool
            .request()
            .input("userId", sql.Int, joinRequest.id_utilisateur)
            .input("deptId", sql.Int, joinRequest.id_departement)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM dbo.SuperAdmin_Departement 
                            WHERE id_utilisateur = @userId AND id_departement = @deptId)
              BEGIN
                INSERT INTO dbo.SuperAdmin_Departement (id_utilisateur, id_departement)
                VALUES (@userId, @deptId)
              END
            `);
        }
      } else if (joinRequest.type_demande === "sous_department") {
        if (userRole === "admin") {
          // Add admin to sous-department
          await pool
            .request()
            .input("userId", sql.Int, joinRequest.id_utilisateur)
            .input("sousDeptId", sql.Int, joinRequest.id_sous_departement)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM dbo.Admin_SousDepartement 
                            WHERE id_utilisateur = @userId AND id_sous_departement = @sousDeptId)
              BEGIN
                INSERT INTO dbo.Admin_SousDepartement (id_utilisateur, id_sous_departement)
                VALUES (@userId, @sousDeptId)
              END
            `);
        } else if (userRole === "user") {
          // Add regular user to sous-department
          await pool
            .request()
            .input("userId", sql.Int, joinRequest.id_utilisateur)
            .input("sousDeptId", sql.Int, joinRequest.id_sous_departement)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM dbo.User_SousDepartement 
                            WHERE id_utilisateur = @userId AND id_sous_departement = @sousDeptId)
              BEGIN
                INSERT INTO dbo.User_SousDepartement (id_utilisateur, id_sous_departement)
                VALUES (@userId, @sousDeptId)
              END
            `);
        }
      }
    }
    
    console.log("18. Join request handling completed successfully");
    res.json({ 
      message: `Join request ${statut === "approved" ? "approved" : "rejected"} successfully`,
      request: joinRequest
    });
  } catch (error) {
    console.error("19. Error in join request approval process:", error);
    res.status(500).json({ error: "Error updating join request", details: error.message });
  }
});
router.get("/users/:userId/sousdepartments/joinrequests", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const pool = await poolPromise;
    
    // Get user role
    const userRole = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT role FROM dbo.Utilisateur WHERE id_utilisateur = @userId");
    
    if (userRole.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const role = userRole.recordset[0].role;
    
    // Different query based on role
    let result;
    if (role === "admin") {
      // For admin, get join requests for sous-departments they manage
      result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT 
            dj.id_demande, 
            dj.id_utilisateur, 
            dj.id_sous_departement, 
            dj.type_demande, 
            dj.statut, 
            dj.date_demande, 
            sd.nom as nom_sous_departement, 
            u.nom as nom_utilisateur,
            u.role as role_utilisateur
          FROM dbo.DemandeJoin dj
          JOIN dbo.SousDepartement sd ON dj.id_sous_departement = sd.id_sous_departement
          JOIN dbo.Utilisateur u ON dj.id_utilisateur = u.id_utilisateur
          JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
          WHERE asd.id_utilisateur = @userId
          AND dj.type_demande = 'sous_department'
          AND dj.statut = 'pending'
        `);
    } else if (role === "superadmin") {
      // For superadmin, get all sous-department join requests
      result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT 
            dj.id_demande, 
            dj.id_utilisateur, 
            dj.id_sous_departement, 
            dj.type_demande, 
            dj.statut, 
            dj.date_demande, 
            sd.nom as nom_sous_departement, 
            u.nom as nom_utilisateur,
            u.role as role_utilisateur
          FROM dbo.DemandeJoin dj
          JOIN dbo.SousDepartement sd ON dj.id_sous_departement = sd.id_sous_departement
          JOIN dbo.Utilisateur u ON dj.id_utilisateur = u.id_utilisateur
          WHERE dj.type_demande = 'sous_department'
          AND dj.statut = 'pending'
        `);
    } else {
      // Regular users don't manage sous-departments, return empty array
      return res.json([]);
    }
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching sous-department join requests:", error);
    res.status(500).json({ error: "Error fetching sous-department join requests" });
  }
});

// Get all join requests
// In your joinRequest.js file
router.get("/join-requests", async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    let queryString = `
      SELECT * FROM dbo.DemandeJoin
      WHERE 1=1
    `;
    
    if (userId) {
      // Convert to integer and validate
      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      request.input("userId", sql.Int, userIdInt);
      queryString += " AND id_utilisateur = @userId";
    }
    
    if (status) {
      request.input("status", sql.VarChar, status);
      queryString += " AND statut = @status";
    }
    
    const result = await request.query(queryString);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching join requests:", error);
    res.status(500).json({ error: "Error fetching join requests" });
  }
});
// Get join requests with optional filters
router.get("/join-requests", async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    let queryString = `
      SELECT * FROM dbo.DemandeJoin
      WHERE 1=1
    `;
    
    if (userId) {
      request.input("userId", sql.Int, userId);
      queryString += " AND id_utilisateur = @userId";
    }
    
    if (status) {
      request.input("status", sql.VarChar, status);
      queryString += " AND statut = @status";
    }
    
    const result = await request.query(queryString);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching join requests:", error);
    res.status(500).json({ error: "Error fetching join requests" });
  }
});
router.post("/debug/test-insert", async (req, res) => {
  try {
    const { userId, departmentId } = req.body;
    
    if (!userId || !departmentId) {
      return res.status(400).json({ error: "Both userId and departmentId are required" });
    }
    
    const pool = await poolPromise;
    
    try {
      const result = await pool.request()
        .input("userId", sql.Int, userId)
        .input("deptId", sql.Int, departmentId)
        .query(`
          INSERT INTO dbo.Admin_Departement (id_utilisateur, id_departement)
          VALUES (@userId, @deptId);
          SELECT SCOPE_IDENTITY() AS insertId;
        `);
      
      res.json({ 
        success: true, 
        insertId: result.recordset[0].insertId,
        message: "Test insert successful" 
      });
    } catch (insertError) {
      res.status(500).json({ 
        success: false, 
        error: "Insert failed", 
        details: insertError.message 
      });
    }
  } catch (error) {
    console.error("Error in test insert:", error);
    res.status(500).json({ error: "Error in test insert", details: error.message });
  }
});

export default router;