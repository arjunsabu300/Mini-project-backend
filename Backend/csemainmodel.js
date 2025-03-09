import mongoose from "mongoose";

const cseMainSchema = new mongoose.Schema({
    sl_no: { type: Number, required: true }, 
    indent_no: { type: String, required: true },
    date_of_purchase: { type: Date, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    remaining: { type: Number, required: true }
});

const CseMain = mongoose.model("csemain", cseMainSchema, "csemain");

export default CseMain;
