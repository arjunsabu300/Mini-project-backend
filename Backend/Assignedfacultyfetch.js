import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Assignedfacultylist from "./Assignedfacultylistschema.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret"; // Use .env for security



router.get("/facultylist", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
      }
  
      // Decode the JWT token
      const decoded = jwt.verify(token, SECRET_KEY);
      const senderEmail = decoded.email;

      const facultylist = await Assignedfacultylist.find();
  
      const facultyInfo = facultylist.map(record => ({
        facultyName: record.facultyName,
        facultyemail: record.facultyemail,
        department: record.department,
        premise: record.premise,
        assigned_date: new Date(record.assigned_date).toLocaleDateString(),
        last_date: new Date(record.last_date).toLocaleDateString(),
        status: record.status,
        verified_date: new Date(record.verified_date).toLocaleDateString(),
      }));
  
      // ✅ Return formatted array
      res.json(facultyInfo);
  
    } catch (error) {
      console.error("❌ Error fetching report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


  
export default router;