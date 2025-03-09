import express from "express";
import SicStockAccept from "./SicStockAccept.js";
import HODForwardNotification from "./HodForwardNotification.js";

const router = express.Router();

// New API call to create a SicStockAccept notification
router.post("/api/create-sicstockaccept", async (req, res) => {
    try {
        const { notifId } = req.body;

        const notification = await HODForwardNotification.findById(notifId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const newNotification = new SicStockAccept({
            sender: notification.receiver,
            receiver: notification.sender,
            indent_no: notification.indent_no,
            quantity: notification.quantity,
            status: "unread"
        });

        await newNotification.save();

        return res.status(201).json({ message: "Notification created successfully", notification: newNotification });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
