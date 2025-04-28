import express from "express";
import { poolPromise, sql } from "../db.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`SELECT * FROM dbo.Utilisateur WHERE email = @email`);

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.mot_de_passe);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Auth successful — send back user info (you could use a token here)
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id_utilisateur,
        name: user.nom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
