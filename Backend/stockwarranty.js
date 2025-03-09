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

router.get("/warrantydetails", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received Token:", token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Get room number based on user access
    const accessData = await Access.findOne({ email_id: email });
    if (!accessData) return res.status(404).json({ message: "No access data found" });

    const room_no = accessData.room_no;

    // Find unique item numbers in the room
    const itemsInRoom = await BelongsTo.find({ room_no }).distinct("item_no");

    // Find indent numbers for those items
    const indentRecords = await Includes.find({ item_no: { $in: itemsInRoom } });

    // Use Set to avoid duplicate indent numbers
    const indentNoSet = new Set(indentRecords.map((record) => record.indent_no));

    // Fetch stock details for unique indent numbers
    const stockDetails = await Stock.find({ indent_no: { $in: Array.from(indentNoSet) } });

    // Fetch item details for the items in the room
    const itemDetails = await Item.find({ item_no: { $in: itemsInRoom } });

    // Map item status for quick lookup
    const itemStatusMap = itemDetails.reduce((map, item) => {
      map[item.item_no] = item.status;
      return map;
    }, {});

    // Construct stock info while avoiding duplicates
    const stockInfo = indentRecords.map((record) => {
      const stock = stockDetails.find((s) => s.indent_no === record.indent_no);
      if (!stock) return null;

      const purchaseDate = new Date(stock.date_of_purchase);

      // Extract warranty period (e.g., "2 years" → 2)
      const warrantyYears = parseInt(stock.warranty_period.match(/\d+/), 10) || 0;

      // Calculate expiry date
      const expiryDate = new Date(purchaseDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + warrantyYears);

      // Determine warranty status
      const warrantyStatus = expiryDate >= new Date() ? "In Warranty" : "Out Of Warranty";

      return {
        item_no: record.item_no,
        indent_no: stock.indent_no || "N/A",
        item_name: stock.name,
        date_of_invoice: stock.date_of_purchase,
        expiry_date: expiryDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
        warranty_status: warrantyStatus,
        description: stock.specification,
        price: stock.price,
        status: itemStatusMap[record.item_no] || "Unknown",
      };
    }).filter(Boolean); // Remove null entries

    res.json(stockInfo);
  } catch (error) {
    console.error("❌ Error fetching stock details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
