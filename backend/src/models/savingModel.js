import mongoose from 'mongoose';

const savingSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    color: { type: String, default: '#10b981' },
    description: { type: String }
}, { timestamps: true });

const Saving = mongoose.model('Saving', savingSchema);
export default Saving;