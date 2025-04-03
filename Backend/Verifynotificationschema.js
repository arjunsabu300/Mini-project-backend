import mongoose from 'mongoose';

const verifyNotificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    verifier_name: { type: String, required: true },
    verifier_email: { type: String, required: true },
    premise: { type: String, required: true },
    verify_date: { type: Date},
    status: { type: String, default: 'unread' },
    date: { type: Date, default: Date.now },
    approval: {type:String, default: 'Pending'}
});

const VerifyNotification = mongoose.models.VerifyNotification || mongoose.model('VerifyNotification', verifyNotificationSchema, 'notifications');

export default VerifyNotification;