import express from "express";
import HODForwardNotification from "./HodForwardNotification.js";
import CseMain from "./csemainmodel.js";
import SicRejectNotification from "./SicRejectNotification.js";

const router = express.Router();

//this is to reject forwarded stock by hod by SIC even though api call is called hod-reject

// API to handle HOD reject notification
router.post("/api/hod-reject-notification", async (req, res) => {
    try {
        const { notifId } = req.body;

        if (!notifId) {
            return res.status(400).json({ error: "Notification ID is required" });
        }

        // 🔍 Find the rejected notification
        const notification = await HODForwardNotification.findById(notifId);
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        // ✅ Update status to "read"
        notification.status = "read";
        await notification.save();

        // 🔍 Find corresponding entry in "csemain"
        const { indent_no, date_of_purchase, quantity, price } = notification;
        const cseMainEntry = await CseMain.findOne({ indent_no, date_of_purchase, price });

        if (cseMainEntry) {
            // ✅ Update remaining stock
            cseMainEntry.remaining += quantity;
            await cseMainEntry.save();
        } else {
            return res.status(404).json({ error: "Matching stock entry not found" });
        }

        // 🔔 Create a new SicRejectNotification
        const sicRejectNotif = new SicRejectNotification({
            sender: notification.receiver,
            receiver: notification.sender,
            date: new Date(),
            indent_no: notification.indent_no,
            quantity: notification.quantity,
        });

        await sicRejectNotif.save();

        res.json({ message: "Notification processed successfully" });
    } catch (error) {
        console.error("❌ Error processing HOD reject notification:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
