import mongoose from "mongoose";

const maintenanceHistorySchema = new mongoose.Schema({
    item_no: { type: String, required: true },
    status: { type: String, required: true },
    completed_date: { type: Date, default: Date.now },
    remarks: { type: String },
    item_status: { type: String, required: true },
    amount: {type: Number}
});

const MaintenanceHistory = mongoose.models.MaintenanceHistory || mongoose.model("MaintenanceHistory", maintenanceHistorySchema, "maintenancehistory");

export default MaintenanceHistory;
