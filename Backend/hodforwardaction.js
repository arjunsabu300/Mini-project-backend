import express from "express";
import HODForwardNotification from "./HodForwardNotification.js";
import SicStockAccept from "./SicStockAccept.js";

const router = express.Router();

// Fetch notification details for pre-filling AddStockSic and update status to "read"
router.get("/api/get-stock-details", async (req, res) => {
    try {
        const { notifId } = req.query;
        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        const notification = await HODForwardNotification.findById(notifId);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // Update status to "read"
        notification.status = "read";
        await notification.save();

        const { indent_no, item_name, quantity, price, date_of_purchase } = notification;

        return res.json({
            indent_no,
            name: item_name,
            qty: quantity,
            price,
            date_of_purchase,
        });
    } catch (error) {
        console.error("Error fetching stock details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
