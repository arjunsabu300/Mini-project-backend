import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Room from "./Roommodel.js";
import Access from "./Access.js";
import User from "./usermodel.js";
import TransferStockNotification from "./transferstocknotificatiion.js";

dotenv.config();
const router = express.Router();

router.post("/transfer", async (req, res) => {
  try {
    let { transfers, senderEmail } = req.body;

    // Ensure transfers is an array
    if (!Array.isArray(transfers)) {
      transfers = [transfers]; // Convert to array if it's a single object
    }

    if (!transfers.length) {
      return res.status(400).json({ error: "No items selected for transfer." });
    }

    let allTransfersProcessed = [];

    for (const transfer of transfers) {
      const { item_no, room_no } = transfer;

      if (!item_no || !room_no) {
        return res.status(400).json({ error: "Missing item number or room number." });
      }

      // Ensure item_no is an array (handles single/multiple items)
      const items = Array.isArray(item_no) ? item_no : [item_no];
      const roomNo = Number(room_no);

      console.log("Processing transfer for items:", items, "Room:", roomNo);

      // Find room in the Room collection
      const room = await Room.findOne({ room_no: roomNo });

      if (!room) {
        console.log("Room not found:", roomNo);
        continue; // Skip this transfer
      }

      // Find access records for the room
      const accessRecords = await Access.find({ room_no: roomNo });

      if (!accessRecords.length) {
        console.log("No access records found for room:", roomNo);
        continue;
      }

      // Extract email IDs from access records
      const accessEmails = accessRecords.map(access => access.email_id);
      console.log("Emails found for room:", roomNo, accessEmails);

      // Find the Stock-In-Charge user
      const stockInChargeUser = await User.findOne({
        email_id: { $in: accessEmails },
        designation: "Stock-In-Charge"
      });

      if (!stockInChargeUser) {
        console.log("Stock-In-Charge not found for room:", roomNo);
        continue;
      }

      console.log("Stock-In-Charge Found:", stockInChargeUser.email_id);

      // Create separate notifications for each item
      for (const item of items) {
        const newNotification = new TransferStockNotification({
          sender: senderEmail,
          receiver: stockInChargeUser.email_id,
          item_no: item, // Individual item
        });

        await newNotification.save();
        allTransfersProcessed.push(item);
      }
    }

    if (!allTransfersProcessed.length) {
      return res.status(404).json({ error: "No valid transfers were processed." });
    }

    return res.status(201).json({ 
      message: "Stock transfers recorded successfully.", 
      processedItems: allTransfersProcessed 
    });

  } catch (error) {
    console.error("Error processing stock transfer:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
