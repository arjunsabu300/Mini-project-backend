
import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Clearance from "./clearenceschema.js";
import Access from "./Access.js";
import BelongsTo from "./BelongsTo.js";
import Includes from "./Includes.js";
import Item from "./Item.js";
import Stock from "./Stock.js";

const router = express.Router();


router.get("/stockclearance", async (req, res) => {
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
      
      
          // Find indent numbers for those items
          const clearrecords = await Clearance.find({ room_no: { $in: roomNos } });
      
      
          // Map item status for quick lookup
          const items = await Clearance.find({
            item_no: { $in: clearrecords.map(m => m.item_no) },
            type: { $regex: `^${itemType}$`, $options: "i" },
          });
          console.log(items);
      
          const itemNos = items.map(item => item.item_no);
          const clearanceRecords = await Clearance.find({item_no: { $in: itemNos }});
  
  
      // Construct stock info while avoiding duplicates
      const stockInfo = clearanceRecords.map((record) => ({
        item_no: record.item_no,
        remarks: record.remarks,
        status: record.status || "Unknown",
        clearance_date: record.clearance_date
      }));
  
      res.json(stockInfo);
    } catch (error) {
      console.error("❌ Error fetching stock details:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

router.post("/clear-stock", async (req, res) => {
  const { item_ids } = req.body;

  try {
    await Clearance.updateMany(
      { item_no: { $in: item_ids } },
      { $set: { status: "Cleared", clearance_date: new Date().toISOString()} }
    );
    await Promise.all([
      BelongsTo.deleteMany({ item_no: { $in: item_ids } }),
      Includes.deleteMany({ item_no: { $in: item_ids } }),
      Item.deleteMany({ item_no: { $in: item_ids } })
    ]);
    res.status(200).json({ message: "Stock cleared successfully" });
  } catch (error) {
    console.error("Error updating stock clearance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

  
  
export default router;