import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./usermodel.js";


dotenv.config();
const router = express.Router();



router.post("/updateUser", async (req, res) => {
    const { email, name } = req.body;
    
    try {
      const user = await User.findOneAndUpdate(
        {email_id: email }, // Find user by email
        {name: name }, // Update name
        { new: true } // Return updated user
      );
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      res.json({ success: true, message: "Profile updated successfully", user });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  

export default router;
