import express from "express";
import TskNotification from "./tskforwardnotification.js";
import HodAcceptNotification from "./HodAcceptNotification.js";
import HodRejectNotification from "./hodrejectnotification.js";
import HODForwardNotification from "./HodForwardNotification.js";
import MainStock from "./mainstockmodel.js";
import SicStockAccept from "./SicStockAccept.js";
import SicRejectNotification from "./SicRejectNotification.js";
import AssignfacultyNotification from "./Assignfacultyschema.js";
import VerifyNotification from "./Verifynotificationschema.js";
import HandoverStockNotification from "./handoverstocknotification.js";
import StockTransferNotification from "./transferstocknotificatiion.js";
import ReportApprove from "./reportApproveSchema.js";

const router = express.Router();

// ✅ Log Receiver Email API
router.get("/api/log-receiver", (req, res) => {
    const { receiver } = req.query;
    if (!receiver) {
        return res.status(400).json({ error: "Receiver email is required" });
    }
    console.log("📩 Receiver Email:", receiver);
    res.json({ message: "Receiver email logged successfully", receiver });
});


// ✅ Fetch & Process Notifications API
router.get("/api/fetch-notifications", async (req, res) => {
    const { receiver } = req.query;
    if (!receiver) {
        return res.status(400).json({ error: "Receiver email is required" });
    }

    try {
        // 🔍 Fetch unread TskForwardNotifications
        const tskNotifications = await TskNotification.find({ receiver, status: "unread",type:"tskstockforward" });
        
        // 🔍 Fetch unread HodAcceptNotifications
        const hodNotifications = await HodAcceptNotification.find({ receiver, status: "unread",type:"hodstockaccept" });
        
        // 🔍 Fetch unread HodForwardNotifications
        const hodForwardNotifications = await HODForwardNotification.find({ receiver, status: "unread",type:"hodstockforward" });

        //Fetch unread sic accept notification
        const sicStockAcceptNotifications = await SicStockAccept.find({ receiver, status: "unread" ,type:"sicstockaccept"});

        //Fetch unread sic accept notification
        const HodRejectNotifications = await HodRejectNotification.find({ receiver, status: "unread" ,type:"hodstockreject"});

        // 🔍 Fetch unread SicStockRejectNotifications
        const sicStockRejectNotifications = await SicRejectNotification.find({ receiver, status: "unread", type: "sicstockreject" });

        const assignnotification= await AssignfacultyNotification.find({receiver: receiver,status: "unread",type:"principalfacultyassign"});

        const verifysnotification= await VerifyNotification.find({receiver: receiver,status: "unread",type:"verifier_report"});

        const stockHandoverNotifications = await HandoverStockNotification.find({ receiver, status: "unread",type: "stockhandover" });
 
        const stockTransferNotifications = await StockTransferNotification.find({ receiver, status: "unread",type: "stocktransfer" });

        const reportapprove = await ReportApprove.find({ receiver, status: "unread",type: "reportapprove" });

        // 🔄 Process TskForwardNotifications
        const detailedTskNotifications = await Promise.all(
            tskNotifications.map(async (notification) => {
                if (notification.type === "tskstockforward") {
                    const { indent_no, sl_no } = notification;
                    const stock = await MainStock.findOne({ indent_no, sl_no });
                    return {
                        _id: notification._id,
                        type: notification.type,
                        indent_no,
                        sl_no,
                        quantity: stock ? stock.quantity : "Not Found",
                        status: notification.status,
                        createdAt: notification.date,
                    };
                }
                return {
                    _id: notification._id,
                    type: notification.type,
                    status: notification.status,
                    createdAt: notification.date,
                };
            })
        );

        // 🔄 Process HodAcceptNotifications
        const detailedHodNotifications = hodNotifications.map((notification) => ({
            _id: notification._id,
            type: notification.type,  // ✅ "hodstockaccept"
            indent_no: notification.indent_no,
            sl_no: notification.sl_no,
            status: notification.status,
            createdAt: notification.date,
        }));

        // 🔄 Process HodForwardNotifications
        const detailedHodForwardNotifications = hodForwardNotifications.map((notification) => ({
            _id: notification._id,
            type: notification.type,  // ✅ "hodforwardstock"
            indent_no: notification.indent_no,
            quantity: notification.quantity,
            message: "Hod Forwarding Stock",
            status: notification.status,
            createdAt: notification.date,
        }));

        // 🔄 Process SicStockAcceptNotifications
        const detailedSicStockAcceptNotifications = sicStockAcceptNotifications.map((notification) => ({
            _id: notification._id,
            type: notification.type,  // ✅ "sicstockaccept"
            indent_no: notification.indent_no,
            quantity: notification.quantity,
            receiver: notification.receiver,
            message: "Stock allocated successfully",
            status: notification.status,
            createdAt: notification.date,
        }));

        const detailedHodRejectNotifications = HodRejectNotifications.map((notification) => ({
            _id: notification._id,
            type: notification.type, // ✅ "hodstockreject"
            indent_no: notification.indent_no,
            sl_no: notification.sl_no,
            message: "Stock Rejected By HOD. Forward Again",
            status: notification.status,
            createdAt: notification.date,
        }));
        // 🔄 Process SicStockRejectNotifications
        const detailedSicStockRejectNotifications = sicStockRejectNotifications.map((notification) => ({
            _id: notification._id,
            type: notification.type,  // ✅ "sicstockreject"
            indent_no: notification.indent_no,
            quantity: notification.quantity,
            sender: notification.sender,
            receiver: notification.receiver,
            message: "Stock rejected by SIC",
            status: notification.status,
            createdAt: notification.date,
        }));
        

        const assignNotifications = await Promise.all(
            assignnotification.map(async (asnotification) => {
                if (asnotification.type === "principalfacultyassign") {
                    // 🔍 Fetch indent_no & sl_no
                    const { facultyname, facultyemail,premise,last_date } = asnotification;


                    return {
                        _id: asnotification._id,
                        type: asnotification.type, // ✅ Send Type
                        facultyname,
                        facultyemail,
                        premise,
                        last_date,
                        status: asnotification.status,
                        createdAt: asnotification.date
                    };
                }

                // Return other notifications as they are where type is not stock forward
                return {
                    _id: asnotification._id,
                    type: asnotification.type, // ✅ Send Type
                    status: asnotification.status,
                    createdAt: asnotification.date,
                };
            })
        );

        const verifyNotifications = await Promise.all(
            verifysnotification.map(async (vnotification) => {
                if (vnotification.type === "verifier_report") {
                    // 🔍 Fetch indent_no & sl_no
                    const { verifier_name, verifier_email,premise,verify_date } = vnotification;


                    return {
                        _id: vnotification._id,
                        type: vnotification.type, // ✅ Send Type
                        verifier_name,
                        verifier_email,
                        premise,
                        verify_date,
                        status: vnotification.status,
                        createdAt: vnotification.date
                    };
                }

                // Return other notifications as they are where type is not stock forward
                return {
                    _id: vnotification._id,
                    type: vnotification.type, // ✅ Send Type
                    status: vnotification.status,
                    createdAt: vnotification.date,
                };
            })
        );


       

        const stockHandover = stockHandoverNotifications.map((handoverNotif) => ({
            _id: handoverNotif._id,
            type: handoverNotif.type,
            sender: handoverNotif.sender,
            room_no: handoverNotif.room_no,
            room_name: handoverNotif.room_name,
            status: handoverNotif.status,
            createdAt: handoverNotif.createdAt,
        }));

        const stockNotifications = stockTransferNotifications.map((stockNotif) => ({
            _id: stockNotif._id,
            type: stockNotif.type,
            sender: stockNotif.sender,  
            item_no: stockNotif.item_no || "N/A",   // ✅ Ensure `item_no` is included
            status: stockNotif.status,
            createdAt: stockNotif.date,
        }));

        const deatiledReportApprove = reportapprove.map((approveNotif) => ({
            _id: approveNotif._id,
            type: approveNotif.type,
            sender: approveNotif.sender,  
            status: approveNotif.status,
            createdAt: approveNotif.date,
        }));

        // ✅ Merge all notifications
        const allNotifications = [
            ...detailedTskNotifications,
            ...detailedHodNotifications,
            ...detailedHodForwardNotifications,
            ...detailedSicStockAcceptNotifications,
            ...detailedHodRejectNotifications,
            ...detailedSicStockRejectNotifications,
            ...assignNotifications, 
            ...verifyNotifications,
            ...stockHandover,
            ...stockNotifications,
            ...deatiledReportApprove,
        ];

        // ✅ Send processed notifications to frontend
        res.json({ data: allNotifications });
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/api/fetchreport", async (req, res) => {
    const { receiver } = req.query;
    if (!receiver) {
        return res.status(400).json({ error: "Receiver email is required" });
    }

    try {

        const verifysnotification= await VerifyNotification.find({receiver: receiver,status: "read"});


        const verifyNotifications = await Promise.all(
            verifysnotification.map(async (vnotification) => {
                if (vnotification.type === "verifier_report") {
                    // 🔍 Fetch indent_no & sl_no
                    const { verifier_name, verifier_email,premise,verify_date } = vnotification;


                    return {
                        _id: vnotification._id,
                        type: vnotification.type, // ✅ Send Type
                        verifier_name,
                        verifier_email,
                        premise,
                        verify_date,
                        status: vnotification.status,
                        createdAt: vnotification.date
                    };
                }

                // Return other notifications as they are where type is not stock forward
                return {
                    _id: vnotification._id,
                    type: vnotification.type, // ✅ Send Type
                    status: vnotification.status,
                    createdAt: vnotification.date,
                };
            })
        );


        // ✅ Merge both notifications
        const allNotifications = [/*...detailedTskNotifications, ...detailedHodNotifications,*/ ...verifyNotifications];

        // ✅ Send processed notifications to frontend
        res.json({ data: allNotifications });
    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
