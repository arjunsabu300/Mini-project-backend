import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import TskForwardNotification from "./tskforwardnotification.js";
import MainStock from "./mainstockmodel.js";
import CseMain from "./csemainmodel.js";
import HodAcceptNotification from "./HodAcceptNotification.js";
import AssignfacultyNotification from "./Assignfacultyschema.js";
import VerifyNotification from "./Verifynotificationschema.js";
import Verificationmodel from "./Verificationlistschema.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret"; // Use .env for security

// ✅ Accept Notification API
router.post("/api/accept-notification", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const senderEmail = decoded.email; // Extract email from token

        const { notifId } = req.body;
        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // ✅ Find and update notification status to "read"
        const notification = await TskForwardNotification.findByIdAndUpdate(
            notifId,
            { status: "read" },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const { indent_no, sl_no } = notification;

        // ✅ Fetch stock details from MainStock
        const stock = await MainStock.findOne({ indent_no, sl_no });
        if (!stock) {
            return res.status(404).json({ error: "Stock not found in MainStock" });
        }

        const { quantity, date_of_purchase, price } = stock;

        // ✅ Add entry to CseMain collection
        await CseMain.create({
            sl_no,
            indent_no,
            quantity,
            date_of_purchase,
            price
        });

        // // ✅ Fetch TSK email (assuming tsk user exists)
        // const tskUser = await User.findOne({ designation: "tsk" });
        // if (!tskUser) {
        //     return res.status(404).json({ error: "TSK user not found" });
        // }

        // ✅ Create a new notification entry for TSK
        const newNotification = new HodAcceptNotification({
            sender: senderEmail,
            receiver: "tsk@rit.ac.in",
            indent_no,
            sl_no,
        });

        await newNotification.save();

        res.json({ message: "Stock accepted and forwarded successfully" });

    } catch (error) {
        console.error("❌ Error accepting notification:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Reject Notification API
router.post("/api/reject-notification", async (req, res) => {
    try {
        const { notifId } = req.body;
        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // ✅ Find and update notification status to "rejected"
        const notification = await TskForwardNotification.findByIdAndUpdate(
            notifId,
            { status: "rejected" },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Stock rejected successfully" });

    } catch (error) {
        console.error("❌ Error rejecting notification:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/api/Add-account", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const senderEmail = decoded.email; // Extract email from token

        const { notifId } = req.body;
        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // ✅ Find and update notification status to "read"
        const notification = await AssignfacultyNotification.findByIdAndUpdate(
            notifId,
            { status: "read" },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const { facultyname, facultyemail,premise,last_date } = notification;

        res.json({data: notification});

    } catch (error) {
        console.error("❌ Error accepting notification:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



export default router;
