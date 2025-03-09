import express from "express";
import Verificationmodel from "./Verificationlistschema.js";
import Item from "./Item.js";
import VerifyNotification from "./Verifynotificationschema.js";
import Access from "./Access.js";
import Room from "./Roommodel.js";
import User from "./usermodel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Clearance from "./clearenceschema.js";
import Maintenance from "./Maintenanceschema.js";
import Assignedfacultylist from "./Assignedfacultylistschema.js";
import BelongsTo from "./BelongsTo.js";


dotenv.config();
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

// Route to create a new verification entry
router.post("/Verification", async (req, res) => {
    try {
        const { verifierName, verifierEmail, dateOfVerify, itemNo, statusOfItem, remarks } = req.body;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }
        const decoded = jwt.verify(token, SECRET_KEY);
        const designation=decoded.designation;

        // Validate required fields
        if (!verifierName || !verifierEmail || !itemNo || !dateOfVerify || !statusOfItem || !remarks) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Ensure item exists in database
        const item = await Item.findOne({ item_no:itemNo });
        const roomnode=await Access.findOne({email_id: verifierEmail});
        const roomname=await Room.findOne({room_no: roomnode.room_no});
        const  roomnoitem = await BelongsTo.findOne({item_no: item.item_no});
        console.log(roomnoitem);
        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }


        // Create verification record in Verificationlist collection
        const newVerification = new Verificationmodel({
            verifier_name: verifierName,
            verifier_email: verifierEmail,
            item_no: itemNo,
            date_of_verify: new Date(dateOfVerify).toLocaleDateString(),
            status: statusOfItem,
            Remarks: remarks || ""
        });

        const assignedfaculty = await Assignedfacultylist.findOne({facultyemail: verifierEmail ,status:"Pending"})
        if (assignedfaculty) {
            assignedfaculty.verified_date =new Date(dateOfVerify).toLocaleDateString();
            assignedfaculty.status = "Completed"; 
            await assignedfaculty.save(); 
        } else {
            console.log("No pending faculty assignment found.");
        }

        if(statusOfItem==="Not Repairable")
        {

            const newclear = new Clearance({
                item_no: itemNo,
                remarks: remarks,
                type: item.type,
                room_no: roomnoitem.room_no,
                status: "Pending Clearance"
            });
            await newclear.save();

            await Maintenance.deleteOne({item_no: itemNo});

        }

        

        await newVerification.save();
        return res.status(201).json({ message: "Verification created successfully", newVerification });
    } catch (error) {
        console.error("Error creating verification:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


router.post("/notifverification", async (req, res) => {
    try {
        const { verifierName, verifierEmail, itemNo, dateOfVerify, statusOfItem } = req.body;

        if (!verifierName || !verifierEmail || !itemNo || !dateOfVerify || !statusOfItem) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }
        const decoded = jwt.verify(token, SECRET_KEY);
        const designation=decoded.designation;

        const principal = await User.findOne({ designation: "principal" });
        if (!principal) {
            return res.status(404).json({ error: "Principal not found" });
        }

        const roomnode = await Access.findOne({ email_id: verifierEmail });
        const roomname = roomnode ? await Room.findOne({ room_no: roomnode.room_no }) : null;

        if(designation.toLowerCase()==="furniture-verifier")
        {
            const newverifierNotification = new VerifyNotification({
                type: "verifier_report",
                sender: verifierEmail,
                receiver: principal.email_id,
                verifier_name: verifierName,
                verifier_email: verifierEmail,
                premise: "CSE Furniture",
                verify_date: new Date(dateOfVerify).toLocaleDateString(),
                status: "unread",
                date: new Date().toISOString()
            });
    
            await newverifierNotification.save(); 
        }
        else
        {
            const newverifierNotification = new VerifyNotification({
                type: "verifier_report",
                sender: verifierEmail,
                receiver: principal.email_id,
                verifier_name: verifierName,
                verifier_email: verifierEmail,
                premise: roomname ? roomname.name : "Unknown",
                verify_date: new Date(dateOfVerify).toLocaleDateString(),
                status: "unread",
                date: new Date().toISOString()
            });
    
            await newverifierNotification.save();
        }
        
        await Access.deleteMany({email_id: verifierEmail});
        await User.deleteMany({email_id: verifierEmail});
        return res.status(201).json({ message: "Verification message sent successfully" });

    } catch (error) {
        console.error("Error creating verification:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

        



export default router;
