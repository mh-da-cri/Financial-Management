import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        // Đã sửa dòng log theo ý bạn
        console.log("Đã kết nối DB thành công");
    } catch (error) {
        console.error(`Lỗi kết nối: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;