import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
  verifier_name: { type: String, required: true },
  verifier_email: { type: String, required: true },
  item_no: { type: String, required: true },
  date_of_verify: { type: Date, required: true },
  status: { type: String,enum: ["Working", "Not Working","Not Repairable"], required: true },
  Remarks: { type: String, required: true }
});

const Verificationmodel = mongoose.models.Verificationmodel || mongoose.model("Verificationlist", verificationSchema, "verficationlist");

export default Verificationmodel;
