import mongoose from "mongoose";

const sicRejectNotificationSchema = new mongoose.Schema({
    type: { type: String, default: "sicstockreject" }, // Always "sicstockreject"
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    date: { type: Date, default: Date.now },
    indent_no: { type: String, required: true },
    quantity: { type: Number, required: true },
    status: {type: String, default: "unread"},
});

const SicRejectNotification = mongoose.model("SicRejectNotification", sicRejectNotificationSchema, "notifications");

export default SicRejectNotification;
