import mongoose from 'mongoose';

const walletSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    icon: { type: String, default: 'wallet' },
    color: { type: String, default: '#000000' } // Thêm màu để hiển thị Card ví đẹp hơn
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;