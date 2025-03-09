import mongoose from "mongoose";

// Define the schema for the "main" collection
const stockSchema = new mongoose.Schema({
    sl_no: { type: Number, required: true },
    indent_no: { type: String, required: true },
    date_of_purchase: { type: Date, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },  // ✅ Added Quantity field
    department: { type: String, default: "" }  
});

// ✅ Create and export the model
const MainStock = mongoose.model("Main", stockSchema, "main");
export default MainStock;
