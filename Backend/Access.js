import mongoose from "mongoose";

// Define the schema for the Access model
const accessSchema = new mongoose.Schema({
  email_id: { type: String, required: true },  
  room_no: { type: Number},   
});

// Create the Access model using the schema
const Access = mongoose.models.Access || mongoose.model("Access", accessSchema, "access");

export default Access;
