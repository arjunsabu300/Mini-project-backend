import mongoose from "mongoose";

const clearenceSchema = new mongoose.Schema({
  item_no: { type: String, required: true },
  clearance_date: {type: Date},
  remarks: { type: String, required: true },
  type: String,
  room_no: Number,
  status: {
    type: String,
    enum: ["Pending Clearance", "Cleared"],
    default: "Pending Clearance"
  }
});

const Clearance = mongoose.models.Clearance || mongoose.model("Clearance", clearenceSchema, "clearance");

export default Clearance;