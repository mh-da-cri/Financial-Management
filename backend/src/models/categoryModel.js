import mongoose from 'mongoose';

const categorySchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true }, // VD: Ăn uống
    type: { type: String, required: true, enum: ['income', 'expense'] },
    icon: { type: String, required: true, default: 'circle' },
    color: { type: String, required: true, default: '#000000' } // Bắt buộc có màu cho biểu đồ
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;