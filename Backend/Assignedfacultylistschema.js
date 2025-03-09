import mongoose from "mongoose";

const AssignedfacultylistSchema = new mongoose.Schema({
    facultyName: { type: String, required: true },
    facultyemail: { type: String, required: true },
    department: { type: String },
    premise: { type: String, required: true },
    assigned_date: { type: Date, default: Date.now },
    last_date: { type: Date},
    verified_date:{type: Date},
    status: { type: String, default: "Pending" }

});

const Assignedfacultylist = mongoose.models.Assignedfacultylist || mongoose.model("Assignedfacultylist", AssignedfacultylistSchema, "assignedfacultylist");

export default Assignedfacultylist;