import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Access from "./Access.js";
import Item from "./Item.js";
import Includes from "./Includes.js";
import Stock from "./Stock.js";

dotenv.config();
const router = express.Router();


router.put("/updateStatus", async (req, res) => {
  const { item_no, status } = req.body;

  if (!item_no || !status) {
    return res.status(400).json({ message: "Missing item_no or status" });
  }

  try {
    const updatedItem = await Item.findOneAndUpdate(
      { item_no }, // Search by item_no
      { status },  // Update status field
      { new: true } // Return updated document
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Stock item not found" });
    }

    res.json({ message: "Status updated successfully", updatedItem });
  } catch (error) {
    console.error("Error updating stock status:", error);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;