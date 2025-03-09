import express from "express";
import Room from "./Roommodel.js";  

const router = express.Router();


router.get("/inventory", async (req, res) => {
  try {
    const rooms = await Room.find({type:"Lab"}, "name");  
    res.status(200).json(rooms);  
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});


router.get("/allinventorys", async (req, res) => {
  try {
    const rooms = await Room.find({}, "name");  
    res.status(200).json(rooms);  
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

router.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}, "name room_no"); // Fetch name & room_no only
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

export default router;
