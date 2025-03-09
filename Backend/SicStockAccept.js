import mongoose from "mongoose";

const SicStockAcceptSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "sicstockaccept"
    },
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    indent_no: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "unread"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const SicStockAccept = mongoose.model("SicStockAccept", SicStockAcceptSchema,"notifications");
export default SicStockAccept;
