const express = require("express");
const { poolPromise, sql } = require("../db");
const bcrypt = require("bcrypt"); // ✅ Import bcrypt
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    const pool = await poolPromise;
    await pool.request()
      .input("nom", sql.VarChar, fullName)
      .input("email", sql.VarChar, email)
      .input("mot_de_passe", sql.VarChar, hashedPassword) // 🔒 store hashed password
      .input("role", sql.VarChar, role)
      .query(`
        INSERT INTO dbo.Utilisateur (nom, email, mot_de_passe, role)
        VALUES (@nom, @email, @mot_de_passe, @role)
      `);

    res.status(200).json({ message: "User registered!" });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "Registration failed." });
  }
});

module.exports = router;
