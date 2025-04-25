const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

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
    const { requestId } = req.params;
    const { statut } = req.body;
    
    // Validate the status
    if (statut !== "approved" && statut !== "rejected") {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }
    
    const pool = await poolPromise;
    
    // First get the request details to know what type it is
    const getRequest = await pool
      .request()
      .input("requestId", sql.Int, requestId)
      .query("SELECT * FROM dbo.DemandeJoin WHERE id_demande = @requestId");
    
    if (getRequest.recordset.length === 0) {
      return res.status(404).json({ error: "Join request not found" });
    }
    
    const joinRequest = getRequest.recordset[0];
    
    // Update the status
    await pool
      .request()
      .input("requestId", sql.Int, requestId)
      .input("statut", sql.VarChar, statut)
      .query("UPDATE dbo.DemandeJoin SET statut = @statut WHERE id_demande = @requestId");
    
    // If approved, add the relationship to the appropriate table
    if (statut === "approved") {
      // Get user role
      const userRoleResult = await pool
        .request()
        .input("userId", sql.Int, joinRequest.id_utilisateur)
        .query("SELECT role FROM dbo.Utilisateur WHERE id_utilisateur = @userId");
      
      if (userRoleResult.recordset.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userRole = userRoleResult.recordset[0].role;
      
      if (joinRequest.type_demande === "department") {
        // Only superadmins should be able to join departments
        if (userRole === "superadmin") {
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
    
    res.json({ 
      message: `Join request ${statut === "approved" ? "approved" : "rejected"} successfully`,
      request: joinRequest
    });
  } catch (error) {
    console.error("Error updating join request:", error);
    res.status(500).json({ error: "Error updating join request" });
  }
});


module.exports = router;