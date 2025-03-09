import express from "express";
import MainStock from "./mainstockmodel.js";

const router = express.Router();

// Route to fetch all stock details
router.get("/api/mainstock", async (req, res) => {
    try {
        const stocks = await MainStock.find();
        res.status(200).json(stocks);
    } catch (error) {
        console.error("Error fetching stock details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
