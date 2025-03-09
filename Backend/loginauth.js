import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "./usermodel.js";
import Access from "./Access.js";
import Room from "./Roommodel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";
const OTP_EXPIRY_TIME = 5 * 60 * 1000;
// const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 5, // Limit each IP to 5 login attempts
//     message: { message: "Too many login attempts. Please try again later." },
//     standardHeaders: true, // Return rate limit info in headers
//     legacyHeaders: false, // Disable X-RateLimit-* headers
// });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});


// Login Route
router.post("/", async (req, res) => {
    const { email, password } = req.body;
    console.log("🔹 Login Request Received:", email);
    let roomname=null;

    try {
        const user = await User.findOne({ email_id: email });
        if(user.designation.toLowerCase()==="stock-in-charge" || user.designation.toLowerCase()==="custodian")
        {
            const accessdetails = await Access.findOne({email_id: email});
            const roomdetails = await Room.findOne({room_no: accessdetails.room_no})
            roomname = roomdetails.name;
        }
        if(user.designation.toLowerCase()==="furniture-custodian")
        {
            roomname="CSE Furniture";
        }
        if (!user) return res.status(400).json({ message: "User not found" });

        if (password !== user.password) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { email, name: user.name, designation: user.designation,roomname: roomname },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token: token,
            designation: user.designation
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error });
    }
});

// Nodemailer Setup


// Send OTP for Password Reset
router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    console.log(`🔹 Sending OTP to: ${email}`);

    try {
        const user = await User.findOne({ email_id: email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const otp = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit OTP
        const expiry = new Date(Date.now() + OTP_EXPIRY_TIME); // Expiry in 5 minutes
        user.otp = otp;
        user.otpExpires = expiry;
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            text: `Dear User,\n\nWe received a request to reset your password. Please use the One-Time Password (OTP) below to proceed:\n🔹 OTP: ${otp}\n\nThis OTP is valid for the next 5 minutes. If you did not request a password reset, please ignore this email.\n\nBest regards,\n CSE Stock Management System`
        };
        

        // Send Email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("❌ Error sending email:", err);
                return res.status(500).json({ message: "Failed to send OTP", error: err.message });
            }
            console.log("✅ Email sent successfully:", info.response);
            res.json({ message: "OTP sent successfully" });
        });

        // await transporter.sendMail(mailOptions);
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error });
    }
});

// Verify OTP
router.post("/verify-otp",async (req, res) => {
    const { email, otp } = req.body;
    console.log(`🔹 Verifying OTP for: ${email}`);

    try {
        const user = await User.findOne({ email_id: email });
        if (!user || !user.otp || !user.otpExpires) {
            return res.status(400).json({ message: "OTP not found or expired" });
        }

        if (new Date() > user.otpExpires) {
            user.otp = null;
            user.otpExpires = null;
            await user.save();
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // OTP verified, clear stored OTP
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.json({ message: "OTP verified successfully", success: true });
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP", error });
    }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;
    console.log(`🔹 Resetting password for: ${email}`);

    try {
        const user = await User.findOne({ email_id: email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const Password = newPassword // Hash password
        user.password = Password;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Error resetting password", error });
    }
});

export default router;
