import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./Roommodel.js";
import Access from "./Access.js";
import User from "./usermodel.js";
import HandoverStockNotification from "./handoverstocknotification.js";

dotenv.config();
const router = express.Router();

router.post("/handover", async (req, res) => {  // Change from GET to POST
  try {
    const { senderEmail } = req.body;

    if (!senderEmail) {
      return res.status(400).json({ error: "Sender email is required." });
    }

    // Fetch room_no from Access collection
    const accessRecord = await Access.findOne({ email_id: senderEmail });
    if (!accessRecord) {
      return res.status(404).json({ error: "Access record not found for user." });
    }
    const roomNo = accessRecord.room_no;

    // Fetch room_name from Room collection
    const room = await Room.findOne({ room_no: roomNo });
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }
    const roomName = room.name;

    // Define a fixed receiver email for now
    const receiverEmail = "arjunsabuakatsuki@gmail.com";

    // Create handover notification with correct type and status
    const newNotification = new HandoverStockNotification({
      type: "stockhandover",  
      sender: senderEmail,
      receiver: receiverEmail,
      room_no: roomNo,
      room_name: roomName,
      status: "unread",
    });

    await newNotification.save();

    return res.status(201).json({ message: "Handover notification recorded successfully." });
  } catch (error) {
    console.error("Error processing handover:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
