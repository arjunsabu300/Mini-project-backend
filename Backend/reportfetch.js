import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import VerifyNotification from "./Verifynotificationschema.js";
import Verificationmodel from "./Verificationlistschema.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret"; // Use .env for security



router.post("/reportviews", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
      }
  
      // Decode the JWT token
      const decoded = jwt.verify(token, SECRET_KEY);
      const senderEmail = decoded.email;
  
      const { notifId } = req.body;
      console.log(notifId);
      if (!notifId) {
        return res.status(400).json({ error: "Notification ID is required" });
      }
  
      // ✅ Find the notification and mark it as read
      const notification = await VerifyNotification.findByIdAndUpdate(
        notifId,
        { status: "read" },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      // console.log(notification);
      const { verifier_email, verify_date } = notification;
      console.log(verify_date);
      // ✅ Fetch all items verified by this email
      const items = await Verificationmodel.find({ verifier_email:verifier_email,date_of_verify:verify_date });
      console.log("items" ,items);
  
      if (!items.length) {
        return res.status(404).json({ error: "No items found for this verifier" });
      }
      
      // ✅ Format the response
      // const itemDetails = items.map((item) => ({
      //   item_no: item.item_no,
      //   status: item.status,
      //   remarks: item.Remarks,
      //   date_of_verify: new Date(item.date_of_verify).toLocaleDateString()

      // }));
      const uniqueItems = new Map();
          items.forEach((item) => {
            if (!uniqueItems.has(item.item_no)) {
              uniqueItems.set(item.item_no, {
                item_no: item.item_no,
                status: item.status,
                remarks: item.Remarks,
                date_of_verify: new Date(item.date_of_verify).toLocaleDateString("en-GB"),
              });
            }
          });

      const itemDetails = Array.from(uniqueItems.values());

      console.log(itemDetails);
  
      // ✅ Send the response in table format
      res.json({
        verifier_email,
        verify_date,
        itemDetails,
      });
  
    } catch (error) {
      console.error("❌ Error fetching report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


  
export default router;