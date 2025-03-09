import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import TransferStockNotification from "./transferstocknotificatiion.js";
import Access from "./Access.js"; // Stores email_id and room_no
import Room from "./Roommodel.js"; // Stores room_no and name

dotenv.config();
const router = express.Router();

router.get("/transferlogs", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Find the current user's room number
    const userAccess = await Access.findOne({ email_id: email });
    if (!userAccess) return res.status(404).json({ message: "No access data found" });

    const userRoom = userAccess.room_no;

    // Fetch notifications where status is "accepted"
    const notifications = await TransferStockNotification.find({ status: "accepted" });

    // Fetch sender and receiver room details
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        // Find sender's room number
        const senderAccess = await Access.findOne({ email_id: notification.sender });
        const receiverAccess = await Access.findOne({ email_id: notification.receiver });

        const senderRoomNo = senderAccess ? senderAccess.room_no : null;
        const receiverRoomNo = receiverAccess ? receiverAccess.room_no : null;

        // Find sender and receiver room details
        const senderRoom = senderRoomNo ? await Room.findOne({ room_no: senderRoomNo }) : null;
        const receiverRoom = receiverRoomNo ? await Room.findOne({ room_no: receiverRoomNo }) : null;

        return {
          item_no: notification.item_no,
          date: notification.date,
          sender_email: notification.sender,
          receiver_email: notification.receiver,
          sender_room_no: senderRoomNo || "Unknown",
          sender_room_name: senderRoom ? senderRoom.name : "Unknown",
          receiver_room_no: receiverRoomNo || "Unknown",
          receiver_room_name: receiverRoom ? receiverRoom.name : "Unknown",
        };
      })
    );

    // Filter notifications where the user has access to either sender or receiver's room
    const filteredNotifications = enrichedNotifications.filter(
      (notif) => notif.sender_room_no === userRoom || notif.receiver_room_no === userRoom
    );

    res.json(filteredNotifications);
  } catch (error) {
    console.error("❌ Error fetching transfer logs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
