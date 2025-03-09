
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Maintenance from "./Maintenanceschema.js";
import Item from "./Item.js";
import Clearance from "./clearenceschema.js";
import MaintenanceHistory from "./Maintenancehistoryschema.js";
import Access from "./Access.js";
import BelongsTo from "./BelongsTo.js";
import Includes from "./Includes.js";
import Stock from "./Stock.js";

const router = express.Router();

// GET /api/maintenance/list - Fixed population logic
router.get("/list", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
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
    const maintenanceList = await Maintenance.find({ item_no: { $in: itemsInRoom } });
    // Fetch item details
    const items = await Item.find({
      item_no: { $in: maintenanceList.map(m => m.item_no) },
      type: { $regex: `^${itemType}$`, $options: "i" },
    });

    const itemMap = new Map(items.map(item => [item.item_no, item]));

    const itemNumbers = items.map(item => item.item_no);

  // Fetch maintenance records for filtered items
    const maintenancerec = await Maintenance.find({ item_no: { $in: itemNumbers } });

    // Transform response
    const transformedList = maintenancerec.map(m => ({
      _id: m._id,
      itemId: m.item_no,
      repairDate: m.complaint_date,
      serviceProvider: m.service_provider,
      amount: m.amount || 0,
      remarks: m.remarks,
      itemStatus: itemMap.get(m.item_no)?.status || "Unknown",
      maintenanceStatus: m.status,
    }));

    console.log("Transformed records:", transformedList.length);
    res.json(transformedList);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ 
      message: "Failed to fetch maintenance data",
      error: error.message
    });
  }
});

// PUT /api/maintenance/update - Fixed update logic
router.put("/update", async (req, res) => {
  const { id, field, value } = req.body;
  const allowedFields = ["amount", "remarks", "service_provider"];

  try {
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: "Invalid field for update" });
    }

    const updated = await Maintenance.findByIdAndUpdate(
      id,
      { [field]: value },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({ message: "Invalid update operation" });
  }
});

// POST /api/maintenance/complete 
router.post("/complete", async (req, res) => {
  const { id, field, value } = req.body;

  try {
    const maintenance = await Maintenance.findById(id);
    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    const item = await Item.findOne({ item_no: maintenance.item_no });
    if (!item) {
      return res.status(404).json({ message: "Linked item not found" });
    }

   
    if (field === "maintenanceStatus") {
      maintenance.status = value;
      await maintenance.save();
    }

   
    if (field === "itemStatus") {
      item.status = value;
      await item.save();

      
      if (maintenance.status === "Completed") {
      
        const newHistory = new MaintenanceHistory({
          item_no: maintenance.item_no,
          status: maintenance.status,
          completed_date: new Date(),
          remarks: maintenance.remarks,
          item_status: value,
          amount: maintenance.amount
        });
        await newHistory.save();

        
        if (value === "Working") {
          await Maintenance.findByIdAndDelete(id);
        }
        
      }
    }

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.get("/maintenancehistory", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received Token:", token);
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

    // Find indent numbers for those items
    const maintenanceRecords = await MaintenanceHistory.find({ item_no: { $in: itemsInRoom } });


    // Map item status for quick lookup
    const items = await Item.find({
      item_no: { $in: maintenanceRecords.map(m => m.item_no) },
      type: { $regex: `^${itemType}$`, $options: "i" },
    });
    console.log(items);

    const itemNos = items.map(item => item.item_no);
    const maintenancehis = await MaintenanceHistory.find({ item_no: { $in: itemNos } });
    console.log(maintenancehis);

    // Construct stock info while avoiding duplicates
    const stockInfo = maintenancehis.map((record) => ({
      item_no: record.item_no,
      status: record.status || "Unknown",
      completed_date: record.completed_date, // This now ensures correct dates
      remarks: record.remarks,
      amount: record.amount,
      item_status: record.item_status || "Unknown",
    }));

    res.json(stockInfo);

  } catch (error) {
    console.error("❌ Error fetching stock details:", error);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;