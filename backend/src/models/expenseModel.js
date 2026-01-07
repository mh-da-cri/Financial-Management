import mongoose from 'mongoose';

const expenseSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    wallet: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Wallet' },
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }, // Quan trọng cho khung ngày & biểu đồ cột
    description: { type: String }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;