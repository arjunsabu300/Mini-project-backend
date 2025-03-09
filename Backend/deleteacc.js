import express from "express";
import Access from "./Access.js"; // Import Access from Access.js
import User from "./usermodel.js"

const router = express.Router();

// DELETE user and access entries
router.post("/api/delete-account", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Delete user entry
    const userDeleted = await User.deleteOne({ email_id: email });

    // Delete multiple access entries
    const accessDeleted = await Access.deleteMany({ email_id: email });

    res.json({
      message: "Account deleted successfully",
      userDeleted: userDeleted.deletedCount,
      accessDeleted: accessDeleted.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
