import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  indent_no: { type: String, required: true },
  sl_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  date_of_purchase: { type: Date, required: true },
  specification: { type: String, required: true },
  warranty_period: { type: String, required: true },
  price: { type: Number, required: true }
});

const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema, "stock");

export default Stock;
