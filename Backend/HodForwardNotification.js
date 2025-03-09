import mongoose from "mongoose";

const hodForwardNotificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    indent_no: { type: String, required: true },
    item_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    date_of_purchase: { type: Date, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true }, 
    date: { type: Date, default: Date.now },
    status: { type: String, default: "unread" } // ✅ Added default "unread" status
});

const HODForwardNotification = mongoose.model("HODForwardNotification", hodForwardNotificationSchema, "notifications");

export default HODForwardNotification;
