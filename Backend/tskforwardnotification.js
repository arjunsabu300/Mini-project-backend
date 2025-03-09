import mongoose from 'mongoose';

const tskForwardNotificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    indent_no: { type: String, required: true },
    sl_no: { type: Number, required: true }, // Changed to integer
    status: { type: String, default: 'unread' },
    date: { type: Date, default: Date.now }
});

const TskForwardNotification = mongoose.model('TskForwardNotification', tskForwardNotificationSchema, 'notifications');
export default TskForwardNotification;