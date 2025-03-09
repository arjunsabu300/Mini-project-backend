import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./Backend/database.js";
import loginauthRoutes from "./Backend/loginauth.js";
import registerRoutes from "./Backend/register.js";
import RoomRoutes from "./Backend/Room.js";
import StockdetailsRoutes from "./Backend/Stockdetails.js";
import StockstatusupdateRoutes from "./Backend/stockstatusupdate.js";
import addstocksicRoutes from "./Backend/addstocksic.js";
import RegistercomplaintRoutes from "./Backend/Registercomplaint.js";
import maintenanceRoutes from "./Backend/maintenance.js";
import ClearancestockRoutes from "./Backend/Clearancestock.js";
import AssignfacultyprincipalRoutes from "./Backend/Assignfacultyprincipal.js";
import notificationRoutes from "./Backend/notification.js";
import notificationcontrollerRoutes from "./Backend/notificationcontrollerarjun.js";
import AddaccountbynotiRoutes from "./Backend/Addaccountbynoti.js";
import profilebackRoutes from "./Backend/profileback.js";
import VerificationRoutes from "./Backend/Verification.js";
import reportfetchRoutes from "./Backend/reportfetch.js";
import requeststockdetailsRoutes from "./Backend/requeststockdetails.js";
import AssignedfacultyfetchRoutes from "./Backend/Assignedfacultyfetch.js";
import mainRoutes from "./Backend/mainstockdetails.js";
import forwardStockRoutes from "./Backend/forwardtsk.js";
import forwardactionRoutes from "./Backend/forwardaction.js";
import forwardhodRoutes from "./Backend/forwardstockhod.js";
import SicStockAcceptNotfSenderRoutes from "./Backend/SicStockAcceptNotfSender.js";
import hodforwardactionRoutes from "./Backend/hodforwardaction.js";
import markreadRoutes from "./Backend/markread.js"
import sicrejecterRoutes from "./Backend/sicrejecter.js";
import roomRoutes from "./Backend/roomRoutes.js"
import deleteaccRoutes from "./Backend/deleteacc.js";
import warrantyroutes from "./Backend/stockwarranty.js";
import stockhandover from "./Backend/stockhandover.js";
import handoveraction from "./Backend/handoveraction.js";
import transfer from "./Backend/stocktranfer.js";
import transferactionroute from "./Backend/transferaction.js";
import transferlog from "./Backend/transferlog.js";
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/loginauth", loginauthRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/Room", RoomRoutes);
app.use("/api/stock", StockdetailsRoutes);
app.use("/api/ustock", StockstatusupdateRoutes); // ✅ Add new endpoint for stock status updates
app.use("/",addstocksicRoutes);
app.use("/api/complaints",RegistercomplaintRoutes);
app.use("/api/maintenance",maintenanceRoutes);
app.use("/api",ClearancestockRoutes);
app.use(AssignfacultyprincipalRoutes);
app.use(notificationRoutes);
app.use(notificationcontrollerRoutes);
app.use(AddaccountbynotiRoutes);
app.use("/api/profile",profilebackRoutes);
app.use("/api/stockverify",VerificationRoutes);
app.use("/api/report",reportfetchRoutes);
app.use("/api/request",requeststockdetailsRoutes);
app.use("/api/faculty",AssignedfacultyfetchRoutes);
app.use(forwardactionRoutes);
app.use(forwardStockRoutes);
app.use(forwardhodRoutes);
app.use(mainRoutes);
app.use(SicStockAcceptNotfSenderRoutes);
app.use(hodforwardactionRoutes);
app.use(markreadRoutes);
app.use(sicrejecterRoutes);
app.use("/api/rooms", roomRoutes);
app.use(deleteaccRoutes);
app.use("/api/stock", warrantyroutes);
app.use("/api", stockhandover);
app.use(handoveraction);
app.use("/api/ststock", transfer);
app.use(transferactionroute);
app.use("/api", transferlog);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));