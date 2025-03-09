import mongoose from "mongoose";

const TransferStockNotificationSchema = new mongoose.Schema({
  type: { type: String, default: "stocktransfer" },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  item_no: { type: String, required: true }, // Single item per notification
  date: { type: Date, default: Date.now },
  status: { type: String, default: "unread" },
});

const TransferStockNotification = mongoose.model(
  "TransferStockNotification",
  TransferStockNotificationSchema,
  "notifications"
);

export default TransferStockNotification;
