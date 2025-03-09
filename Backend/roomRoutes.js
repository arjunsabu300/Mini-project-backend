import express from "express";
import Room from "./Roommodel.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        let { room_no, name, type } = req.body;

        room_no = parseInt(room_no, 10);

        if (!name || !type) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newRoom = new Room({ room_no, name, type });
        await newRoom.save();

        res.status(201).json({ message: "Room created successfully", room: newRoom });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router; // ✅ Fix export
