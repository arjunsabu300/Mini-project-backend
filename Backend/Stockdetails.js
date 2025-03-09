import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Access from "./Access.js";
import BelongsTo from "./BelongsTo.js";
import Item from "./Item.js";
import Includes from "./Includes.js";
import Stock from "./Stock.js";

dotenv.config();
const router = express.Router();

router.get("/stockdetails", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received Token:", token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const designation = decoded.designation.toLowerCase();
    
    let roomNos = [];
    let itemType = "electronics";

    if (designation === "stock-in-charge" || designation === "custodian" || designation === "verifier") {
      const accessData = await Access.findOne({ email_id: email });
      if (!accessData) return res.status(404).json({ message: "No access data found" });
      
      roomNos = [accessData.room_no];
    } else if (designation === "furniture-custodian" || designation === "furniture-verifier") {
      const accessData = await Access.find({ email_id: email });
      if (!accessData.length) return res.status(404).json({ message: "No access data found" });
      
      roomNos = accessData.map(data => data.room_no).flat();
      itemType = "furniture";
    }

    if (roomNos.length === 0) return res.status(404).json({ message: "No rooms found for the given email" });
    
    // Find unique item numbers in the rooms
    const itemsInRooms = await BelongsTo.find({ room_no: { $in: roomNos } }).distinct("item_no");
    
    // Find indent numbers for those items
    const indentRecords = await Includes.find({ item_no: { $in: itemsInRooms } });
    const indentNoSet = new Set(indentRecords.map(record => record.indent_no));
    
    // Fetch stock details for unique indent numbers
    const stockDetails = await Stock.find({ indent_no: { $in: Array.from(indentNoSet) } });
    
    // Fetch item details, filtering by the required item type
    const allItems = await Item.find({ item_no: { $in: itemsInRooms } });
    const filteredItems = allItems.filter(item => item.type.toLowerCase() === itemType);
    
    // Create a status map only for filtered items
    const itemStatusMap = filteredItems.reduce((map, item) => {
      map[item.item_no] = item.status;
      return map;
    }, {});
    
    // Construct stock info, filtering only for required items
    const stockInfo = indentRecords
      .filter(record => itemStatusMap.hasOwnProperty(record.item_no))
      .map(record => {
        const stock = stockDetails.find(s => s.indent_no === record.indent_no);
        if (!stock) return null;
        
        return {
          item_no: record.item_no,
          indent_no: stock.indent_no || "N/A",
          item_name: stock.name,
          date_of_invoice: stock.date_of_purchase,
          description: stock.specification,
          price: stock.price,
          status: itemStatusMap[record.item_no] || "Unknown",
        };
      })
      .filter(Boolean); // Remove null entries

    res.json(stockInfo);
  } catch (error) {
    console.error("❌ Error fetching stock details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
