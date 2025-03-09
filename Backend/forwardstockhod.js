import express from "express";
import mongoose from "mongoose";
import CseMain from "./csemainmodel.js";
import Room from "./Roommodel.js";
import Access from "./Access.js";
import User from "./usermodel.js";
import HODForwardNotification from "./HodForwardNotification.js";

const router = express.Router();

// ✅ Fetch stock items with remaining quantity > 0
router.get("/api/fetch-stock", async (req, res) => {
    try {
        const stockItems = await CseMain.find({ remaining: { $gt: 0 } });
        res.json(stockItems);
    } catch (error) {
        console.error("Error fetching stock:", error);
        res.status(500).json({ message: "Failed to fetch stock items" });
    }
});

// ✅ Fetch available premises (room names)
router.get("/api/fetch-premises", async (req, res) => {
    try {
        const rooms = await Room.find({}, "name"); // Fetch only the 'name' field
        res.json(rooms);
    } catch (error) {
        console.error("Error fetching premises:", error);
        res.status(500).json({ message: "Failed to fetch premises" });
    }
});

// ✅ Forward stock and update remaining quantity
router.post("/api/forward-stock-hod", async (req, res) => {
    try {
        const { sl_no, indent_no, item_name, quantity, price, date_of_purchase, premise } = req.body;

        // ✅ Validate input fields
        if (!sl_no || !indent_no || !item_name || !quantity || !price || !date_of_purchase || !premise) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ✅ Ensure valid number inputs
        const parsedSLNo = parseInt(sl_no, 10); // `sl_no` is a number
        const parsedQuantity = parseInt(quantity, 10);
        const parsedPrice = parseFloat(price);

        if (isNaN(parsedSLNo) || isNaN(parsedQuantity) || isNaN(parsedPrice)) {
            return res.status(400).json({ message: "Invalid input format for SL No, Quantity, or Price" });
        }

        // ✅ Ensure indent_no is treated as a string
        const parsedIndentNo = indent_no.trim(); // `indent_no` remains a string

        // ✅ Use both `sl_no` (number) and `indent_no` (string) to fetch the correct stock item
        const stockItem = await CseMain.findOne({ sl_no: parsedSLNo, indent_no: parsedIndentNo });

        if (!stockItem) {
            return res.status(404).json({ message: "Stock item not found" });
        }

        // ✅ Check if enough quantity is available before updating
        if (stockItem.remaining < parsedQuantity) {
            return res.status(400).json({ message: "Insufficient stock available" });
        }

        // ✅ Deduct quantity atomically
        const updatedStock = await CseMain.findOneAndUpdate(
            { sl_no: parsedSLNo, indent_no: parsedIndentNo, remaining: { $gte: parsedQuantity } }, // Ensure correct stock
            { $inc: { remaining: -parsedQuantity } }, // Deduct quantity
            { new: true } // Return the updated document
        );

        if (!updatedStock) {
            return res.status(400).json({ message: "Stock update failed. Possible concurrency issue." });
        }

        // ✅ Fetch the room
        const room = await Room.findOne({ name: premise });
        if (!room) {
            return res.status(404).json({ message: "Premise (room) not found" });
        }

        let emailIds = [];
        if (premise !== "CSE Furniture") {
            // ✅ Fetch access records only if premise is not CSE Furniture
            const accessRecords = await Access.find({ room_no: room.room_no });

            if (!accessRecords || accessRecords.length === 0) {
                return res.status(404).json({ message: "No access record found for this room." });
            }

            // ✅ Extract all email IDs from access records
            emailIds = accessRecords.map(access => access.email_id);
        }

        // ✅ Determine recipient based on premise type
        let recipientDesignation = "Stock-In-Charge";
        if (premise === "CSE Furniture") {
            recipientDesignation = "Furniture-Custodian";
        }

        let recipientUser;
        if (premise !== "CSE Furniture"){

             recipientUser = await User.findOne({
                email_id: { $in: emailIds },
                designation: recipientDesignation
            });
        }
        else{
             recipientUser = await User.findOne({
                designation: recipientDesignation
            });

        }


        if (!recipientUser) {
            return res.status(404).json({ message: `No ${recipientDesignation} found for this room.` });
        }

        // ✅ Create a new notification entry with status "unread"
        const notification = new HODForwardNotification({
            type: "hodstockforward",
            indent_no: parsedIndentNo,
            item_name,
            quantity: parsedQuantity,
            price: parsedPrice,
            date_of_purchase: new Date(date_of_purchase),
            sender: "arjunsabuakatsuki@gmail.com", // Replace with actual HOD email ID
            receiver: recipientUser.email_id,
            date: new Date(),
            status: "unread"
        });

        await notification.save();

        res.status(200).json({ message: "Stock forwarded successfully!" });
    } catch (error) {
        console.error("Error forwarding stock:", error);
        res.status(500).json({ message: "Failed to forward stock", error: error.message });
    }
});

export default router;
