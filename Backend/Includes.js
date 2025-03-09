import mongoose from "mongoose";

const includesSchema = new mongoose.Schema({
  item_no: { type: String, required: true },
  indent_no: { type: String, required: true },
  sl_no: { type: Number, required: true }
});

const Includes = mongoose.models.Includes || mongoose.model("Includes", includesSchema, "includes");

export default Includes;