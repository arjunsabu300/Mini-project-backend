import express from "express";
import mongoose from "mongoose";
import GeneralMiniNotification from "./generalmininotification.js"; // ✅ Imported Correct Model

const router = express.Router();

// ✅ Fetch Only Unread General Notifications
router.get("/api/notifications", async (req, res) => {
    try {
        const { receiver } = req.query;

        if (!receiver) {
            return res.status(400).json({ error: "Receiver email is required" });
        }

        // ✅ Query only unread notifications from GeneralMiniNotification
        const query = { receiver, status: "unread" };

        const notifications = await GeneralMiniNotification.find(query).sort({ date: -1 });

        const formattedNotifications = notifications.map(notification => {
            let message;
            switch (notification.type) {
                case "tskstockforward":
                    message = "New message from TSK";
                    break;
                case "verifier_report":
                    message = "New verification report submitted";
                    break;
                case "hod_message":
                    message = "New message from HOD";
                    break;
                case "hodstockaccept":
                    message = "New message from HOD";
                    break;
                case "principalfacultyassign":
                    message="New message from Principal";
                    break;
                case "stockhandover":
                    message="New message from a custodian";
                    break;
                case "stocktransfer":
                    message="New stock transfer request";
                    break;
                case "reportapprove":
                    message="New message from Principal";
                    break;                
                default:
                    message = "New notification received";
                    break;
            }
            return {
                _id: notification._id,
                sender: notification.sender,
                receiver: notification.receiver,
                message,
                type: notification.type,
                status: notification.status,
                createdAt: notification.date
            };
        });

        res.json(formattedNotifications);
    } catch (error) {
        console.error("❌ Error fetching unread general notifications:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
