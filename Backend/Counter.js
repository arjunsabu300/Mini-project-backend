import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    labname: { type: String, required: true },
    itemname: { type: String, required: true },
    value: { type: Number, required: true, default: 0 }
});

// Define a unique compound index
counterSchema.index({ labname: 1, itemname: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
