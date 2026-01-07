import Wallet from '../models/walletModel.js';

// @desc    Lấy danh sách ví của user đang đăng nhập
// @route   GET /api/wallets
// @access  Private
const getWallets = async (req, res) => {
    try {
        // Tìm tất cả ví mà field 'user' trùng với id người đang đăng nhập
        const wallets = await Wallet.find({ user: req.user._id });
        res.status(200).json(wallets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Tạo ví mới
// @route   POST /api/wallets
// @access  Private
const createWallet = async (req, res) => {
    const { name, balance, icon, type, color } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Vui lòng nhập tên ví' });
    }

    try {
        const wallet = await Wallet.create({
            user: req.user._id, // Gắn ví này cho user đang login
            name,
            balance: balance || 0,
            icon: icon || 'wallet',
            type: type || 'cash',
            color: color || '#000000'
        });

        res.status(201).json(wallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cập nhật ví (Đổi tên, icon, màu...)
// @route   PUT /api/wallets/:id
// @access  Private
const updateWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findById(req.params.id);

        if (!wallet) {
            return res.status(404).json({ message: 'Không tìm thấy ví' });
        }

        // Kiểm tra quyền sở hữu: User đang login có phải chủ ví không?
        if (wallet.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền sửa ví này' });
        }

        const updatedWallet = await Wallet.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Trả về data mới sau khi update
        );

        res.status(200).json(updatedWallet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Xóa ví
// @route   DELETE /api/wallets/:id
// @access  Private
const deleteWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findById(req.params.id);

        if (!wallet) {
            return res.status(404).json({ message: 'Không tìm thấy ví' });
        }

        if (wallet.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền xóa ví này' });
        }

        await wallet.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Đã xóa ví thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Chuyển tiền giữa 2 ví
// @route   POST /api/wallets/transfer
// @access  Private
const transferMoney = async (req, res) => {
    const { fromWalletId, toWalletId, amount } = req.body;

    if (!fromWalletId || !toWalletId || !amount) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin' });
    }

    if (fromWalletId === toWalletId) {
        return res.status(400).json({ message: 'Không thể chuyển tiền vào cùng một ví' });
    }

    try {
        const fromWallet = await Wallet.findById(fromWalletId);
        const toWallet = await Wallet.findById(toWalletId);

        if (!fromWallet || !toWallet) {
            return res.status(404).json({ message: 'Không tìm thấy ví' });
        }

        // Kiểm tra quyền sở hữu
        if (fromWallet.user.toString() !== req.user._id.toString() || 
            toWallet.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền thực hiện trên ví này' });
        }

        // Logic chuyển tiền
        fromWallet.balance -= Number(amount);
        toWallet.balance += Number(amount);

        await fromWallet.save();
        await toWallet.save();

        res.status(200).json({ message: 'Chuyển tiền thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Nhớ thêm transferMoney vào export
export { getWallets, createWallet, updateWallet, deleteWallet, transferMoney };