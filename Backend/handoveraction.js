import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import HandoverStockNotification from "./handoverstocknotification.js"; 
import BelongsTo from "./BelongsTo.js";
import Access from "./Access.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";


router.post("/api/accept-stock-handover", async (req, res) => {
    try {
        console.log("hiii");
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const { notifId, room_no } = req.body;

        if (!notifId || !room_no) {
            return res.status(400).json({ error: "Notification ID and Room No are required" });
        }

        // ✅ Find the handover notification
        const handoverNotif = await HandoverStockNotification.findById(notifId);
        if (!handoverNotif) {
            return res.status(404).json({ error: "Handover notification not found." });
        }

        // ✅ Remove sender from Access table
        const removedAccess = await Access.findOneAndDelete({ email_id: handoverNotif.sender });
        if (!removedAccess) {
            return res.status(404).json({ error: "Sender does not have room access assigned." });
        }

        // ✅ Mark the handover notification as "accepted"
        await HandoverStockNotification.findByIdAndUpdate(notifId, { status: "accepted" });

        res.json({ success: true, message: "Stock handover accepted successfully." });

    } catch (error) {
        console.error("❌ Error accepting stock handover:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * ❌ Reject Stock Handover API
 * - Marks notification as "rejected"
 */
router.post("/api/reject-stock-handover", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const { notifId } = req.body;

        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // ✅ Update the notification status to "rejected"
        const updatedNotification = await HandoverStockNotification.findByIdAndUpdate(notifId, { status: "rejected" });

        if (!updatedNotification) {
            return res.status(404).json({ error: "Handover notification not found." });
        }

        res.json({ success: true, message: "Stock handover rejected successfully." });

    } catch (error) {
        console.error("❌ Error rejecting stock handover:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;