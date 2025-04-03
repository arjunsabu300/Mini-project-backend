import mongoose from "mongoose";

const reportApproveSchema = new mongoose.Schema({
  type: { type: String, default: "reportapprove" },
  sender: { type: String, required: true }, // Principal's email
  receiver: { type: String, required: true }, // Stock-In-Charge email
  status: { type: String, default: "unread" },
  date: { type: Date, default: Date.now },
});

const ReportApprove = mongoose.model("ReportApprove", reportApproveSchema, "notifications");

export default ReportApprove;
