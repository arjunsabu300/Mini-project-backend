import express from "express";
import HodAcceptNotification from "./HodAcceptNotification.js";
import SicStockAccept from "./SicStockAccept.js";
import SicRejectNotification from "./SicRejectNotification.js";

const router = express.Router();

// ✅ Mark Notification as Read API
router.post("/api/mark-notification-read", async (req, res) => {
    const { notifId } = req.body;

    if (!notifId) {
        return res.status(400).json({ error: "Notification ID is required" });
    }

    try {
        // Try updating in sicstockaccept and hodstockaccept collections
        const updateResult = await Promise.any([
            HodAcceptNotification.findByIdAndUpdate(notifId, { status: "read" }, { new: true }),
            SicStockAccept.findByIdAndUpdate(notifId, { status: "read" }, { new: true }),
            SicRejectNotification.findByIdAndUpdate(notifId, { status: "read" }, { new: true }),
        ]);

        if (!updateResult) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification marked as read successfully", notification: updateResult });
    } catch (error) {
        console.error("❌ Error marking notification as read:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
