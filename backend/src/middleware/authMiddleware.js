import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Lấy token từ header (Dạng: Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token lấy ID
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm user trong DB và gán vào req.user (trừ field password)
            req.user = await User.findById(decoded.id).select('-password');

            next(); // Cho phép đi tiếp
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Không có quyền truy cập, token sai' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Không có quyền truy cập, không tìm thấy token' });
    }
};

export default protect;