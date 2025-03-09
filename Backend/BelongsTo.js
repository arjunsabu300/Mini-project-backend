import mongoose from "mongoose";

const belongsToSchema = new mongoose.Schema({
  item_no: { type: String, required: true },
  room_no: { type: Number, required: true }
});

const BelongsTo = mongoose.models.BelongsTo || mongoose.model("BelongsTo", belongsToSchema, "belongs_to");

export default BelongsTo;