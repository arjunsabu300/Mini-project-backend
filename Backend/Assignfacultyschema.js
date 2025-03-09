import mongoose from 'mongoose';

const assignfacultyprincipalNotificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    facultyname: { type: String, required: true },
    facultyemail: { type: String, required: true },
    premise: { type: String, required: true },
    last_date: { type: Date},
    status: { type: String, default: 'unread' },
    date: { type: Date, default: Date.now }
});

const AssignfacultyNotification = mongoose.models.AssignfacultyNotification || mongoose.model('AssignfacultyNotification', assignfacultyprincipalNotificationSchema, 'notifications');

export default AssignfacultyNotification;