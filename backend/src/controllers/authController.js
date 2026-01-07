import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';
import Category from '../models/categoryModel.js';
import generateToken from '../libs/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Đăng ký người dùng mới
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    // 1. Nhận username thay vì name
    const { username, email, password } = req.body;

    // 2. Kiểm tra dữ liệu
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // 3. Kiểm tra user tồn tại (Check cả Email HOẶC Username)
    const userExists = await User.findOne({ 
        $or: [{ email }, { username }] 
    });
    
    if (userExists) {
        return res.status(400).json({ message: 'Email hoặc Tên đăng nhập đã tồn tại' });
    }

    // 4. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Tạo User
    const user = await User.create({
        username, // Lưu username
        email,
        password: hashedPassword,
    });

    if (user) {
        // --- AUTO SETUP DATA (Giữ nguyên logic tạo ví/danh mục cũ của bạn) ---
        await Wallet.create({
            user: user._id,
            name: 'Tiền mặt',
            balance: 0,
            icon: 'wallet',
            color: '#10b981'
        });

        const defaultCategories = [
            { name: 'Ăn uống', type: 'expense', icon: 'utensils', color: '#f87171' },
            { name: 'Di chuyển', type: 'expense', icon: 'bus', color: '#60a5fa' },
            { name: 'Mua sắm', type: 'expense', icon: 'shopping-cart', color: '#c084fc' },
            { name: 'Lương', type: 'income', icon: 'banknote', color: '#34d399' },
            { name: 'Thưởng', type: 'income', icon: 'gift', color: '#fbbf24' },
        ];

        const categoriesWithUser = defaultCategories.map(cat => ({ ...cat, user: user._id }));
        await Category.insertMany(categoriesWithUser);
        // --- KẾT THÚC AUTO SETUP ---

        res.status(201).json({
            _id: user._id,
            username: user.username, // Trả về username
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
};

// @desc    Đăng nhập & lấy token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    // Nhận username thay vì email
    const { username, password } = req.body;

    // Tìm user theo username
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
};

export { registerUser, loginUser };