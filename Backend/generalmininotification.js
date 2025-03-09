import mongoose from "mongoose";

const GeneralMiniNotificationSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Notification Type
    sender: { type: String, required: true }, // Email or ID of sender
    receiver: { type: String, required: true }, // Email or ID of receiver
    status: { type: String, default: "unread" }, // unread / read
    date: { type: Date, default: Date.now } // Timestamp
});

const GeneralMiniNotification = mongoose.model("GeneralMiniNotification", GeneralMiniNotificationSchema, "notifications"); // Uses existing "notifications" collection

export default GeneralMiniNotification;
