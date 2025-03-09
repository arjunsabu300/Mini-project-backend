import express from "express";
import dotenv from "dotenv";
import User from "./usermodel.js";
import Room from "./Roommodel.js";
import Access from "./Access.js";
import nodemailer from "nodemailer";

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || "your_jwt_secret";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register a new user
router.post("/", async (req, res) => {
  try {
    const { firstName, email, password, role, inventory, lastdate } = req.body;

    if (!firstName || !email || !password || !role || !inventory) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const Password = password;
    let validRoomNos = [];
    console.log(inventory);
    // ✅ Fetch all room numbers if role is custodian/verifier
    if (role.toLowerCase() === "furniture-custodian" || role.toLowerCase() === "furniture-verifier") {
      const roomRecords = await Room.find({}, "room_no");
      validRoomNos = roomRecords
        .map(data => Number(data.room_no)) // Convert to Number
        .filter(room => !isNaN(room)); // Remove invalid values

      console.log("Filtered and converted room numbers:", validRoomNos);

      if (validRoomNos.length === 0) {
        return res.status(404).json({ message: "Inventory rooms not found" });
      }
    }

    // ✅ Create new user
    const newUser = new User({
      name: firstName,
      email_id: email,
      password: Password,
      designation: role,
    });

    await newUser.save();
   

    // ✅ If role is NOT furniture-verifier or furniture-custodian, fetch Roomdetails
    let Roomdetails = null;
    if (role.toLowerCase() !== "furniture-custodian" && role.toLowerCase() !== "furniture-verifier") {
      Roomdetails = await Room.findOne({ name: inventory });

      if (!Roomdetails) {
        return res.status(404).json({ message: "Inventory not found" });
      }
    }

    // ✅ Ensure access entries are created for all rooms
    if (validRoomNos.length > 0) {
      for (const room of validRoomNos) {
        const existingAccess = await Access.findOne({ email_id: email, room_no: room });
        if (!existingAccess) {
          console.log(`Adding access for ${email} to room ${room}`);
          await Access.create({ email_id: email, room_no: room });
        }
      }
    } else if (Roomdetails) {
      // ✅ Single Room Assignment (Stock In-Charge & Custodian)
      const Roomno = Roomdetails.room_no;
      await Access.create({ email_id: email, room_no: Roomno });

      if (role.toLowerCase() === "stock-in-charge") {
        Roomdetails.in_charge = firstName;
      }
      if (role.toLowerCase() === "custodian") {
        Roomdetails.custodian = firstName;
      }
    }

    // ✅ Assign furniture-custodian role
    if (role.toLowerCase() === "furniture-custodian") {
      console.log(firstName);
      await Room.updateMany({ name: inventory }, { $set: { furniture_custodian: firstName } });

    }

    if (Roomdetails) {
      await Roomdetails.save();
      console.log(`✅ Room details updated for ${inventory}`);
    }

   

    // ✅ Send email for verifier roles (async to avoid blocking)
    if (role.toLowerCase() === "verifier") {
      const formattedDate = lastdate ? new Date(lastdate).toLocaleDateString() : "N/A";

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Appointment as Verifier for Premise – ${inventory}`,
        text: `Hello, ${firstName}\n\nI hope this email finds you well.\n\nI am pleased to inform you that you have been appointed as the verifier for the ${inventory}. As part of this role, you are required to verify the records in the Department Stock Management System within the stipulated timeframe.\n\nBelow are your login credentials for accessing the system:\n\nEmail id: ${email}\nPassword: ${Password}\n\nKindly ensure that the verification process is completed by ${formattedDate}. Should you require any assistance or clarification, please do not hesitate to reach out.\n\nWe appreciate your cooperation and diligence in this matter.\n\nBest regards,\nHead of Department, CSE\nRIT\n`,
      };
      await transporter.sendMail(mailOptions);
    }
    if (role.toLowerCase() === "furniture-verifier") {
      const formattedDate = lastdate ? new Date(lastdate).toLocaleDateString() : "N/A";

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Appointment as Furniture Verifier for RIT – ${inventory} Department`,
        text: `Hello, ${firstName}\n\nI hope this email finds you well.\n\nI am pleased to inform you that you have been appointed as the furniture-verifier for the ${inventory} department. As part of this role, you are required to verify the records in the Department Stock Management System within the stipulated timeframe.\n\nBelow are your login credentials for accessing the system:\n\nEmail id: ${email}\nPassword: ${Password}\n\nKindly ensure that the verification process is completed by ${formattedDate}. Should you require any assistance or clarification, please do not hesitate to reach out.\n\nWe appreciate your cooperation and diligence in this matter.\n\nBest regards,\nHead of Department, CSE\nRIT\n`,
      };
      await transporter.sendMail(mailOptions);
    }
    console.log(`✅ User ${email} created successfully`);
    // ✅ Send success response before sending emails
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("❌ Error in registration:", error);
    res.status(500).json({ message: `Unable to register user: ${error.message}` });
  }
});

export default router;
