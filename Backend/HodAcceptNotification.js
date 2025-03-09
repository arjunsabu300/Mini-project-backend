import mongoose from "mongoose";

const hodAcceptNotificationSchema = new mongoose.Schema({
    type: { type: String, required: true, default: "hodstockaccept" },
    sender: { type: String, required: true }, 
    receiver: { type: String, required: true, default: "tsk@rit.ac.in" },
    indent_no: { type: String, required: true },
    sl_no: { type: Number, required: true },
    status: { type: String, required: true, default: "unread" },
    date: { type: Date, default: Date.now }
});

const HodAcceptNotification = mongoose.model("hodacceptnotification", hodAcceptNotificationSchema, "notifications");

export default HodAcceptNotification;
