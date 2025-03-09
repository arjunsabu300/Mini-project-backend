import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./usermodel.js";
import Room from "./Roommodel.js";
import nodemailer from "nodemailer";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret"; // Use .env for security

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,  // Fix self-signed certificate error
  },
});

router.post("/details", async (req, res) => {
    try {
        const {department,inventory} = req.body;
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }
    
        // Decode the JWT token
        const decoded = jwt.verify(token, SECRET_KEY);
        const senderEmail = decoded.email;
        const sendername = decoded.name;
        const role = decoded.designation;
        let emailsic;
        let namesic;
        console.log(inventory);
        console.log(department);
        let stockinchargedetails = await Room.findOne({name: inventory});
        if(inventory.toLowerCase()==="cse furniture")
        {
            namesic = stockinchargedetails.furniture_custodian;
            const sicdetails = await User.findOne({name: namesic,designation: { $regex: new RegExp("^furniture-custodian$", "i") } });
            emailsic=sicdetails.email_id;
        }
        else
        {
            namesic = stockinchargedetails.in_charge;
            const sicdetail = await User.findOne({name: namesic,designation: { $regex: new RegExp("^stock-in-charge$", "i") } });
            emailsic=sicdetail.email_id;
        };
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3);
            const formattedDate = futureDate.toLocaleDateString("en-GB");


        
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: emailsic,
                subject: `Request for Stock Report of RIT ${department}– ${inventory}`,
                text: `Subject: Request for Stock Report – ${inventory}\n\nDear ${namesic},\n\nI hope you are doing well.\n\nAs the Stock-in-Charge, you are requested to provide an updated stock report for the ${inventory}. The report should include current stock levels, recent acquisitions, and any shortages or concerns that need attention.\n\nKindly ensure that the required details are submitted by ${formattedDate}.\n Send the details to Email: ${senderEmail}.\nIf you have any questions or require further clarification, feel free to reach out.\n\nYour cooperation in this matter is greatly appreciated.\n\nBest regards,\n${sendername}\n${role}\nRIT Kottayam\n`

                
        }
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
  
    } catch (error) {
      console.error("❌ Error fetching report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


  
export default router;