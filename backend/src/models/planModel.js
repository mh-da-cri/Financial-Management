import mongoose from 'mongoose';

const planDetailSchema = mongoose.Schema({
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        required: true 
    },
    limitAmount: { type: Number, required: true } // Số tiền dự kiến chi cho danh mục này
});

const planSchema = mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    name: { type: String, required: true }, // VD: Kế hoạch tuần 12/1 - 18/1
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalBudget: { type: Number, required: true }, // Tổng tiền cho cả kế hoạch (VD: 500k)
    details: [planDetailSchema], // Danh sách các mục đã lên kế hoạch
    
    // Trạng thái (để sau này lọc kế hoạch cũ/mới)
    isActive: { type: Boolean, default: true } 
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;