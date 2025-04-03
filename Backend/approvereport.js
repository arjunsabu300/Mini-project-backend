import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import VerifyNotification from "./Verifynotificationschema.js";
import Room from "./Roommodel.js"
import Access from "./Access.js";
import User from "./usermodel.js";
import ReportApprove from "./reportApproveSchema.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

router.post("/approvereport", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    const { notifId } = req.body;
    if (!notifId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    // ✅ Step 1: Update `approval` field in `VerifyNotification`
    const updatedNotification = await VerifyNotification.findByIdAndUpdate(
      notifId,
      { $set: { approval: "Approved" } },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }


    // ✅ Step 2: Fetch `premise_name` from the existing notification
    const premiseName = updatedNotification.premise;
    if (!premiseName) {
      return res.status(400).json({ error: "Premise name not found in notification" });
    }

    // ✅ Step 3: Find `room_no` based on `premise_name` from `Room`
    const room = await Room.findOne({ name: premiseName });
    if (!room) {
      return res.status(404).json({ error: "Room not found for the given premise name" });
    }


    // ✅ Step 4: Fetch all `email_id`s from `Access` where `room_no` matches
    const accessRecords = await Access.find({ room_no: room.room_no });

    if (!accessRecords.length) {
      return res.status(404).json({ error: "No access records found for the room" });
    }

    const emailList = accessRecords.map(record => record.email_id);

    // ✅ Step 5: Filter `Stock-In-Charge` from `User` collection
    const stockInChargeUser = await User.findOne({
      email_id: { $in: emailList },
      designation: "Stock-In-Charge",
    });

    if (!stockInChargeUser) {
      return res.status(404).json({ error: "Stock-In-Charge not found for this room" });
    }


    // ✅ Step 6: Find the principal's email from `User` collection
    const principalUser = await User.findOne({ designation: "principal" });

    if (!principalUser) {
      return res.status(404).json({ error: "Principal not found in the system" });
    }

    console.log("🎓 Principal Found:", principalUser.email_id);

    // ✅ Step 7: Create new entry in `notifications` collection
    const newNotification = new ReportApprove({
      sender: principalUser.email_id,
      receiver: stockInChargeUser.email_id,
    });

    await newNotification.save();

    res.json({
      message: "Approval successfully updated and notification sent to Stock-In-Charge",
      updatedNotification,
      newNotification,
    });

  } catch (error) {
    console.error("❌ Error approving reports:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch Approval Status Route
router.get("/getNotification/:notifId", async (req, res) => {
  try {
    const { notifId } = req.params;

    const notification = await VerifyNotification.findById(notifId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ approval: notification.approval || "Pending" }); // ✅ Default to "Pending"
  } catch (error) {
    console.error("❌ Error fetching notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
