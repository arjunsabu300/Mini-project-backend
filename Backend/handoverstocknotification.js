import mongoose from "mongoose";

const HandoverStockNotificationSchema = new mongoose.Schema({
  type: { type: String, default: "stockhandover" },
  sender: { type: String, required: true },
  receiver: { type: String, default: "arjunsabuakatsuki@gmail.com" },
  room_no: { type: String, required: true },
  room_name: { type: String, required: true },
  status: { type: String, default: "unread" },
}, { timestamps: true });

// Check if model already exists, then use it, otherwise create a new one
const HandoverStockNotification = mongoose.models.HandoverStockNotification ||
  mongoose.model("HandoverStockNotification", HandoverStockNotificationSchema,"notifications");

export default HandoverStockNotification;
