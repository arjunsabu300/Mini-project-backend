import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AssignfacultyNotification from './Assignfacultyschema.js';
import User from './usermodel.js';
import Assignedfacultylist from "./Assignedfacultylistschema.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret"; // Use .env for security


router.post('/api/assign-faculty', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        console.log(token);
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const senderEmail = decoded.email; // Extract email from token

        
        const { facultyName, email, department, premise, lastDate} = req.body;
        
            // Check if required fields are provided
        if (!facultyName || !email || !department || !premise || !lastDate) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newassignedfaculty = new Assignedfacultylist({
            facultyName: facultyName,
            facultyemail: email,
            department: department,
            premise: premise,
            assigned_date: new Date().toISOString(),
            last_date: lastDate,
            status: "Pending"
        });
        await newassignedfaculty.save();

        const hod = await User.findOne({ designation: "hodcse" });
        if (hod) {
            const newfacultyNotification = new AssignfacultyNotification({
                type: "principalfacultyassign",
                sender: senderEmail,
                receiver: hod.email_id,
                facultyname: facultyName,
                facultyemail: email,
                premise: premise,
                last_date: lastDate,
                status: "unread",
                date: new Date().toISOString()
            });
            await newfacultyNotification.save();
        }

        res.status(201).json({ message: "Assigned Faculty successfully!" });
    } catch (error) {
        console.error("Error Assigning Faculty:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
