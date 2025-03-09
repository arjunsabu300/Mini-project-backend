import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Access from "./Access.js";
import BelongsTo from "./BelongsTo.js";
import Item from "./Item.js";
import Includes from "./Includes.js";
import Stock from "./Stock.js";
import Maintenance from "./Maintenanceschema.js";
import Room from "./Roommodel.js";



dotenv.config();
const router = express.Router();

// Configure Nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fetch complaint items
router.get("/registercomplaint", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const roomname = decoded.roomname;
    let roomNos = [];
    let itemType = "electronics";

    // Determine itemType and fetch room numbers
    if (roomname.toLowerCase() === "cse furniture") {
      const accessData = await Access.find({ email_id: email });
      if (!accessData.length) return res.status(404).json({ message: "No access data found" });
      roomNos = accessData.map(data => data.room_no);
      itemType = "furniture";
    } else {
      const accessData = await Access.findOne({ email_id: email });
      if (!accessData) return res.status(404).json({ message: "No access data found" });
      roomNos = [accessData.room_no];
    }

    if (roomNos.length === 0) return res.status(404).json({ message: "No rooms found for the given email" });

    // Get item numbers belonging to the rooms
    const itemsInRoom = await BelongsTo.find({ room_no: { $in: roomNos } }).distinct("item_no");

    // Get maintenance items
    const maintenanceItems = await Maintenance.find().distinct("item_no");

    // Get items matching the type
    const filteredItems = await Item.find({
      item_no: { $in: itemsInRoom },
      type: { $regex: `^${itemType}$`, $options: "i" },  // Direct filter instead of post-processing
    });

    // Get not working items that are not under maintenance
    const notWorkingItems = await Item.find({
      item_no: { $in: filteredItems.map(item => item.item_no), $nin: maintenanceItems },
      status: "Not Working",
    });

    if (notWorkingItems.length === 0) {
      return res.json([]); // Return empty array if no matching items
    }

    // Get indent details
    const indentRecords = await Includes.find({ item_no: { $in: notWorkingItems.map(item => item.item_no) } });
    const indentNos = indentRecords.map(record => record.indent_no);
    const stockDetails = await Stock.find({ indent_no: { $in: indentNos } });

    // Prepare response
    const stockInfo = indentRecords.map((record) => {
      const stock = stockDetails.find(s => s.indent_no === record.indent_no);
      const item = notWorkingItems.find(i => i.item_no === record.item_no);
      if (!stock || !item) return null;

      return {
        item_no: record.item_no,
        indent_no: stock.indent_no || "N/A",
        item_name: stock.name,
        date_of_invoice: stock.date_of_purchase,
        description: stock.specification,
        price: stock.price,
        status: item.status,
      };
    }).filter(Boolean);

    res.json(stockInfo);
  } catch (error) {
    console.error("❌ Error fetching complaint items:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Send complaint email
router.post("/sendcomplaint", async (req, res) => {
  try{

      const { emails, items } = req.body;
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const accessData = await Access.findOne({ email_id: email });
        if (!accessData) return res.status(404).json({ message: "No access data found" });
        const room_no = accessData.room_no;
        const roomdetails = await Room.findOne({room_no: room_no});
        const roomname = roomdetails.name;
      if (!items?.length) {
        return res.status(400).json({ message: "No items selected for complaint." });
      }
      console.log("Received Complaint Data:", req.body);
      console.log("Email User:", process.env.EMAIL_USER);
      console.log("Email Pass:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");

      // Create email content
      const emailBody = items.map(item =>
        `Item No: ${item.item_no}\nItem Name: ${item.item_name}\nDescription: ${item.description}\nStatus: ${item.status}\n`
      ).join("\n");

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails,
        subject: "Complaint Submission",
        text: `Hello,\n\nThis Email is send from RIT CSE ${roomname}\n\n The following items have been submitted for complaint:\n\n${emailBody}\n\nBest regards,\nStock Management System`
      };
      await transporter.sendMail(mailOptions);
      // Create maintenance records
      const maintenanceRecords = items.map(item => ({
        item_no: item.item_no,
        service_provider: emails, 
        status: "Pending",
        complaint_date: new Date()
      }));

      await Maintenance.insertMany(maintenanceRecords);

      res.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

export default router;
