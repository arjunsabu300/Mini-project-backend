import mongoose from "mongoose";

const HodRejectNotificationSchema = new mongoose.Schema({
    type: { type: String, default: "hodstockreject" },
    sender: { type: String, required: true },
    receiver: { type: String, default: "tsk@rit.ac.in" },
    indent_no: { type: String, required: true },
    sl_no: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: "unread" }
});

const HodRejectNotification = mongoose.model("HodRejectNotification", HodRejectNotificationSchema,"notifications");

export default HodRejectNotification;
