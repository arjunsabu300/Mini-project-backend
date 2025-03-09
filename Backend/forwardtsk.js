import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import TskForwardNotification from './tskforwardnotification.js';

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret"; // Use .env for security

const stockSchema = new mongoose.Schema({
    sl_no: { type: Number, required: true }, 
    indent_no: { type: String, required: true },
    date_of_purchase: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }, // ✅ Added quantity field
    department: { type: String, default: "" }
});

const Stock = mongoose.model('main', stockSchema, 'main');
const User = mongoose.model('user', new mongoose.Schema({ email_id: String, designation: String }), 'user');

router.post('/api/forward-stock-tsk', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const senderEmail = decoded.email; // Extract email from token

        const { sl_no, indent_no, date_of_purchase, price, quantity, department } = req.body;

        if (!sl_no || !indent_no || !date_of_purchase || !price || !quantity) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const newStock = new Stock({ sl_no, indent_no, date_of_purchase, price, quantity, department: "" });
        await newStock.save();

        const hod = await User.findOne({ designation: "hodcse" });
        if (hod) {
            const newNotification = new TskForwardNotification({
                type: "tskstockforward",
                sender: senderEmail,
                receiver: hod.email_id,
                indent_no,
                sl_no,
                status: "unread",
            });
            await newNotification.save();
        }

        res.status(201).json({ message: "Stock forwarded successfully!" });
    } catch (error) {
        console.error("Error forwarding stock:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
