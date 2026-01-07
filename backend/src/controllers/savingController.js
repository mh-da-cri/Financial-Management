import Saving from '../models/savingModel.js';
import Wallet from '../models/walletModel.js';

// @desc    Lấy danh sách hũ tiết kiệm
// @route   GET /api/savings
const getSavings = async (req, res) => {
    try {
        const savings = await Saving.find({ user: req.user._id });
        res.status(200).json(savings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Tạo hũ tiết kiệm mới
// @route   POST /api/savings
const createSaving = async (req, res) => {
    const { name, targetAmount, color, description } = req.body;

    if (!name || !targetAmount) {
        return res.status(400).json({ message: 'Vui lòng nhập tên và mục tiêu' });
    }

    try {
        const saving = await Saving.create({
            user: req.user._id,
            name,
            targetAmount,
            currentAmount: 0, // Mới tạo thì là 0 đồng
            color: color || '#10b981',
            description
        });
        res.status(201).json(saving);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Nạp tiền từ Ví vào Tiết kiệm
// @route   POST /api/savings/:id/deposit
const depositToSaving = async (req, res) => {
    const { walletId, amount } = req.body;
    const savingId = req.params.id;

    if (!walletId || !amount) return res.status(400).json({ message: 'Thiếu thông tin ví hoặc số tiền' });

    try {
        // 1. Tìm ví và hũ
        const wallet = await Wallet.findById(walletId);
        const saving = await Saving.findById(savingId);

        if (!wallet || !saving) return res.status(404).json({ message: 'Không tìm thấy ví hoặc hũ tiết kiệm' });

        // 2. Kiểm tra số dư ví
        if (wallet.balance < amount) {
            return res.status(400).json({ message: 'Số dư ví không đủ' });
        }

        // 3. Thực hiện chuyển tiền
        wallet.balance -= Number(amount); // Trừ ví
        saving.currentAmount += Number(amount); // Cộng hũ

        await wallet.save();
        await saving.save();

        res.status(200).json(saving);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Xóa hũ tiết kiệm (Có thể tùy chọn hoàn tiền lại ví nếu cần, ở đây làm đơn giản là xóa luôn)
// @route   DELETE /api/savings/:id
const deleteSaving = async (req, res) => {
    try {
        const saving = await Saving.findById(req.params.id);
        if (!saving) return res.status(404).json({ message: 'Không tìm thấy' });

        if (saving.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền' });
        }

        await saving.deleteOne();
        res.status(200).json({ message: 'Đã xóa hũ tiết kiệm' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getSavings, createSaving, depositToSaving, deleteSaving };