import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import StockTransferNotification from "./transferstocknotificatiion.js"; 
import BelongsTo from "./BelongsTo.js";
import Access from "./Access.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * ✅ Accept Stock Transfer API
 * - Checks user authorization
 * - Updates `room_no` based on access
 * - Marks notification as "accepted"
 */
router.post("/api/accept-stock-transfer", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const userEmail = decoded.email;

        const { notifId, item_no } = req.body;
        if (!notifId || !item_no) {
            return res.status(400).json({ error: "Notification ID and Item No are required" });
        }

        // ✅ Get user's assigned room
        const access = await Access.findOne({ email_id: userEmail });
        if (!access) {
            return res.status(403).json({ error: "Access denied: User is not assigned to a room." });
        }

        // ✅ Update `BelongsTo` with new `room_no`
        const updatedStock = await BelongsTo.findOneAndUpdate(
            { item_no },
            { room_no: access.room_no },
            { new: true }
        );

        if (!updatedStock) {
            return res.status(404).json({ error: `Stock item with Item No: ${item_no} not found.` });
        }

        // ✅ Mark the stock transfer notification as "accepted"
        await StockTransferNotification.findByIdAndUpdate(notifId, { status: "accepted" });

        res.json({ success: true, message: "Stock transfer accepted successfully." });

    } catch (error) {
        console.error("❌ Error accepting stock transfer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * ❌ Reject Stock Transfer API
 * - Marks notification as "rejected"
 */
router.post("/api/reject-stock-transfer", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const { notifId } = req.body;

        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // ✅ Update the notification status to "rejected"
        const updatedNotification = await StockTransferNotification.findByIdAndUpdate(notifId, { status: "rejected" });

        if (!updatedNotification) {
            return res.status(404).json({ error: "Notification not found." });
        }

        res.json({ success: true, message: "Stock transfer rejected successfully." });

    } catch (error) {
        console.error("❌ Error rejecting stock transfer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
