const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

// Get all departments
router.get("/departments", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.Departement");
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ error: "Error fetching departments" });
  }
});

// Get a specific department by ID
router.get("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.Departement WHERE id_departement = @id");
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({ error: "Error fetching department" });
  }
});

// Create a new department
// ... (other imports and routes)

// Create a new department and associate the superadmin
router.post("/departments", async (req, res) => {
    try {
      const { nom, description } = req.body;
      const userId = req.body.userId; // Expect the superadmin's ID in the request
  
      // Validate input
      if (!nom || !userId) {
        return res.status(400).json({ error: "Department name and userId are required" });
      }
  
      const pool = await poolPromise;
      const transaction = new sql.Transaction(pool);
  
      try {
        await transaction.begin();
  
        // 1. Insert the new department
        const insertResult = await transaction.request()
          .input("nom", sql.VarChar, nom)
          .input("description", sql.Text, description || null)
          .query("INSERT INTO dbo.Departement (nom, description) OUTPUT INSERTED.* VALUES (@nom, @description)");
  
        const newDepartment = insertResult.recordset[0];
  
        // 2. Associate the superadmin with the new department
        await transaction.request()
          .input("id_utilisateur", sql.Int, userId)
          .input("id_departement", sql.Int, newDepartment.id_departement)
          .query("INSERT INTO dbo.SuperAdmin_Departement (id_utilisateur, id_departement) VALUES (@id_utilisateur, @id_departement)");
  
        await transaction.commit();
        res.status(201).json(newDepartment);
      } catch (transactionError) {
        await transaction.rollback();
        console.error("Error creating department and associating superadmin:", transactionError);
        res.status(500).json({ error: "Error creating department and associating superadmin" });
      }
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Error creating department" });
    }
  });
  


// Update a department
router.put("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;
    
    // Validate input
    if (!nom) {
      return res.status(400).json({ error: "Department name is required" });
    }
    
    const pool = await poolPromise;
    
    // Check if department exists
    const checkResult = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.Departement WHERE id_departement = @id");
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    // Update the department
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("nom", sql.VarChar, nom)
      .input("description", sql.Text, description || null)
      .query(
        "UPDATE dbo.Departement SET nom = @nom, description = @description OUTPUT INSERTED.* WHERE id_departement = @id"
      );
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ error: "Error updating department" });
  }
});

// Delete a department
router.delete("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Check if department exists
    const checkResult = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.Departement WHERE id_departement = @id");
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }
    
    // Check if department has sous-departments
    const sousDeptCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT COUNT(*) as count FROM dbo.SousDepartement WHERE id_departement = @id");
    
    if (sousDeptCheck.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: "Cannot delete department with sous-departments",
        message: "Remove all sous-departments first"
      });
    }
    
    // Delete the department
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.Departement WHERE id_departement = @id");
    
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "Error deleting department" });
  }
});

// Get all sous-departments
router.get("/sousdepartments", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT sd.*, d.nom as department_name 
      FROM dbo.SousDepartement sd
      JOIN dbo.Departement d ON sd.id_departement = d.id_departement
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching sous-departments:", error);
    res.status(500).json({ error: "Error fetching sous-departments" });
  }
});

// Get sous-departments for a specific department
router.get("/departments/:id/sousdepartments", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.SousDepartement WHERE id_departement = @id");
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching department sous-departments:", error);
    res.status(500).json({ error: "Error fetching department sous-departments" });
  }
});

// Get a specific sous-department by ID
router.get("/sousdepartments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT sd.*, d.nom as department_name 
        FROM dbo.SousDepartement sd
        JOIN dbo.Departement d ON sd.id_departement = d.id_departement
        WHERE sd.id_sous_departement = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Sous-department not found" });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error fetching sous-department:", error);
    res.status(500).json({ error: "Error fetching sous-department" });
  }
});

// Create a new sous-department
router.post("/sousdepartments", async (req, res) => {
  try {
    const { nom, description, id_departement, userId } = req.body; // Add userId
    
    // Validate input
    if (!nom || !id_departement || !userId) {
      return res.status(400).json({ error: "Sous-department name, department ID, and user ID are required" });
    }
    
    const pool = await poolPromise;
    
    // Check if department exists
    const deptCheck = await pool
      .request()
      .input("id", sql.Int, id_departement)
      .query("SELECT * FROM dbo.Departement WHERE id_departement = @id");
    
    if (deptCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Parent department not found" });
    }
    
    // Start a transaction to ensure both inserts happen or neither
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Insert the sous-department
      const insertResult = await transaction.request()
        .input("nom", sql.VarChar, nom)
        .input("description", sql.Text, description || null)
        .input("id_departement", sql.Int, id_departement)
        .query(
          "INSERT INTO dbo.SousDepartement (nom, description, id_departement) OUTPUT INSERTED.* VALUES (@nom, @description, @id_departement)"
        );
      
      const newSousDepartment = insertResult.recordset[0];
      
      // Associate the admin with the new sous-department
      await transaction.request()
        .input("userId", sql.Int, userId)
        .input("sousDepartementId", sql.Int, newSousDepartment.id_sous_departement)
        .query(
          "INSERT INTO dbo.Admin_SousDepartement (id_utilisateur, id_sous_departement) VALUES (@userId, @sousDepartementId)"
        );
      
      await transaction.commit();
      
      res.status(201).json(newSousDepartment);
    } catch (transactionError) {
      await transaction.rollback();
      console.error("Error creating sous-department:", transactionError);
      res.status(500).json({ error: "Error creating sous-department" });
    }
  } catch (error) {
    console.error("Error creating sous-department:", error);
    res.status(500).json({ error: "Error creating sous-department" });
  }
});
// Get departments for a specific user (SuperAdmin)
router.get("/users/:userId/departments", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const pool = await poolPromise;
    
    // For SuperAdmin, get departments through SuperAdmin_Departement mapping table
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT d.* 
        FROM dbo.Departement d
        INNER JOIN dbo.SuperAdmin_Departement sad ON d.id_departement = sad.id_departement
        WHERE sad.id_utilisateur = @userId
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching user departments:", error);
    res.status(500).json({ error: "Error fetching user departments", details: error.message });
  }
});

// Get sous-departments for a specific user
router.get("/users/:userId/sousdepartments", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
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
    
    let result;
    const role = userRole.recordset[0].role;
    
    if (role === "admin") {
      // Get sous-departments administered by this admin
      result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT sd.*, d.nom as department_name 
          FROM dbo.SousDepartement sd
          INNER JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
          INNER JOIN dbo.Departement d ON sd.id_departement = d.id_departement
          WHERE asd.id_utilisateur = @userId
        `);
    } else if (role === "user") {
      // Get sous-departments this user belongs to
      result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT sd.*, d.nom as department_name 
          FROM dbo.SousDepartement sd
          INNER JOIN dbo.User_SousDepartement usd ON sd.id_sous_departement = usd.id_sous_departement
          INNER JOIN dbo.Departement d ON sd.id_departement = d.id_departement
          WHERE usd.id_utilisateur = @userId
        `);
    } else if (role === "superadmin") {
      // For superadmin, get all sous-departments in departments they manage
      result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT sd.*, d.nom as department_name 
          FROM dbo.SousDepartement sd
          INNER JOIN dbo.Departement d ON sd.id_departement = d.id_departement
          INNER JOIN dbo.SuperAdmin_Departement sad ON d.id_departement = sad.id_departement
          WHERE sad.id_utilisateur = @userId
        `);
    } else {
      return res.status(400).json({ error: "Invalid user role" });
    }
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching user sous-departments:", error);
    res.status(500).json({ error: "Error fetching user sous-departments", details: error.message });
  }
});

// Get departments managed by an admin
// Get departments managed by an admin
router.get("/admin/:userId/departments", async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Validate userId
      if (!userId || userId === 'undefined') {
        return res.status(400).json({ error: "Invalid user ID" });
      }
  
      const pool = await poolPromise;
  
      // Explicitly select comparable columns and use DISTINCT
      const result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT  d.id_departement, d.nom, d.description -- Select only comparable columns
          FROM dbo.Departement d
          INNER JOIN dbo.SousDepartement sd ON d.id_departement = sd.id_departement
          INNER JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
          WHERE asd.id_utilisateur = @userId
        `);
  
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching admin departments:", error);
      res.status(500).json({ error: "Error fetching admin departments" });
    }
  });
// Get sous-departments managed by an admin
router.get("/admin/:userId/sousdepartments", async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!userId || userId === 'undefined') {
        return res.status(400).json({ error: "Invalid user ID" });
      }
  
      const pool = await poolPromise;
  
      const result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(`
          SELECT sd.id_sous_departement, sd.nom, sd.description, sd.id_departement, d.nom as department_name
          FROM dbo.SousDepartement sd
          INNER JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
          INNER JOIN dbo.Departement d ON sd.id_departement = d.id_departement
          WHERE asd.id_utilisateur = @userId
        `);
  
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching admin sous-departments:", error);
      res.status(500).json({ error: "Error fetching admin sous-departments" });
    }
  });

// Get admin join requests for sous-departments
// In your routes/departements.js file, find the endpoint:
router.get("/admin/:userId/sousdepartments/joinrequests", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching sous-department join requests for admin:", userId);

    if (!userId || userId === 'undefined') {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const pool = await poolPromise;

    // First, log the sous-departments this admin manages
    const sousDepartmentsResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT sd.id_sous_departement, sd.nom 
        FROM dbo.SousDepartement sd
        INNER JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
        WHERE asd.id_utilisateur = @userId
      `);
    
    console.log("Admin's Sous-Departments:", sousDepartmentsResult.recordset);

    const result = await pool
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
          u.nom as nom_utilisateur
        FROM dbo.DemandeJoin dj
        JOIN dbo.SousDepartement sd ON dj.id_sous_departement = sd.id_sous_departement
        JOIN dbo.Utilisateur u ON dj.id_utilisateur = u.id_utilisateur
        JOIN dbo.Admin_SousDepartement asd ON sd.id_sous_departement = asd.id_sous_departement
        WHERE asd.id_utilisateur = @userId
        AND dj.type_demande = 'sous_department'
        AND dj.statut = 'pending'
      `);
    
    console.log("Found join requests:", result.recordset);
    console.log("Number of join requests:", result.recordset.length);
    
    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching pending sous-department join requests:", error);
    res.status(500).json({ error: "Error fetching pending sous-department join requests" });
  }
});
// Get pending join requests for departments (for SuperAdmin)
// Get pending join requests for departments (for SuperAdmin)
router.get("/join-requests/departments/pending", async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const result = await pool.request().query(`
        SELECT
          dj.id_demande,
          dj.id_utilisateur,
          dj.id_departement,
          dj.type_demande,
          dj.statut,
          dj.date_demande,
          d.nom as nom_departement,
          u.nom as nom_utilisateur,
          u.role as role_utilisateur
        FROM
          dbo.DemandeJoin dj
        INNER JOIN
          dbo.Departement d ON dj.id_departement = d.id_departement
        INNER JOIN
          dbo.Utilisateur u ON dj.id_utilisateur = u.id_utilisateur
        WHERE
          dj.type_demande = 'department' AND dj.statut = 'pending'
        ORDER BY
          dj.date_demande DESC
      `);
  
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching pending department join requests:", error);
      res.status(500).json({ error: "Error fetching pending department join requests" });
    }
  });
  router.get("/admin/:userId/managed-departments", async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`
                SELECT d.id_departement, d.nom, d.description
                FROM dbo.Departement d
                INNER JOIN dbo.Admin_Departement ad ON d.id_departement = ad.id_departement
                WHERE ad.id_utilisateur = @userId
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching admin's departments:", error);
        res.status(500).json({ error: "Error fetching admin's departments" });
    }
});
// Update join request status
router.put("/join-requests/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { statut } = req.body;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('requestId', sql.Int, requestId)
      .input('statut', sql.VarChar, statut)
      .query(`
        UPDATE dbo.DemandeJoin 
        SET statut = @statut 
        WHERE id_demande = @requestId
      `);

    res.json({ message: 'Join request updated successfully' });
  } catch (error) {
    console.error('Error updating join request:', error);
    res.status(500).json({ error: 'Error updating join request' });
  }
});

// Add user to sous-department
router.post("/user-sousdepartment", async (req, res) => {
  try {
    const { userId, sousDepartementId } = req.body;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('sousDepartementId', sql.Int, sousDepartementId)
      .query(`
        INSERT INTO dbo.User_SousDepartement 
        (id_utilisateur, id_sous_departement) 
        VALUES (@userId, @sousDepartementId)
      `);

    res.status(201).json({ message: 'User added to sous-department successfully' });
  } catch (error) {
    console.error('Error adding user to sous-department:', error);
    res.status(500).json({ error: 'Error adding user to sous-department' });
  }
});

// Add user to department
router.post("/user-department", async (req, res) => {
  try {
    const { userId, departementId } = req.body;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('departementId', sql.Int, departementId)
      .query(`
        INSERT INTO dbo.User_Departement 
        (id_utilisateur, id_departement) 
        VALUES (@userId, @departementId)
      `);

    res.status(201).json({ message: 'User added to department successfully' });
  } catch (error) {
    console.error('Error adding user to department:', error);
    res.status(500).json({ error: 'Error adding user to department' });
  }
});
module.exports = router;