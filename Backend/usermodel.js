import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email_id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    designation: String,
    otp: { type: String },  // Store OTP
    otpExpires: { type: Date }, // OTP expiration timestamp
});

const User = mongoose.model("User", userSchema, 'user');

export default User;
