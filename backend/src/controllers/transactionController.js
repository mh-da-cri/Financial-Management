import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Wallet from '../models/walletModel.js';

// @desc    Thêm giao dịch mới
// @route   POST /api/transactions
const addTransaction = async (req, res) => {
    const { type, walletId, categoryId, amount, date, description } = req.body;

    if (!type || !walletId || !categoryId || !amount) {
        return res.status(400).json({ message: 'Vui lòng nhập đủ: loại, ví, danh mục, số tiền' });
    }

    try {
        const wallet = await Wallet.findById(walletId);
        if (!wallet) return res.status(404).json({ message: 'Không tìm thấy ví' });
        if (wallet.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Không có quyền' });

        let transaction;
        const transactionDate = date || Date.now(); // Sử dụng ngày frontend gửi lên (đã fix giờ)

        if (type === 'income') {
            transaction = await Income.create({
                user: req.user._id,
                wallet: walletId,
                category: categoryId,
                amount,
                date: transactionDate,
                description
            });
            wallet.balance += Number(amount);
        } else if (type === 'expense') {
            transaction = await Expense.create({
                user: req.user._id,
                wallet: walletId,
                category: categoryId,
                amount,
                date: transactionDate,
                description
            });
            wallet.balance -= Number(amount);
        } else {
            return res.status(400).json({ message: 'Type không hợp lệ' });
        }

        await wallet.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy toàn bộ lịch sử
// @route   GET /api/transactions
const getTransactions = async (req, res) => {
    try {
        const [incomes, expenses] = await Promise.all([
            Income.find({ user: req.user._id }).populate('wallet category'),
            Expense.find({ user: req.user._id }).populate('wallet category')
        ]);

        const combined = [
            ...incomes.map(item => ({ ...item.toObject(), type: 'income' })),
            ...expenses.map(item => ({ ...item.toObject(), type: 'expense' }))
        ];

        // Sắp xếp mới nhất lên đầu
        combined.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... (Giữ nguyên updateTransaction và deleteTransaction như cũ)
const updateTransaction = async (req, res) => {
    const { type, id } = req.params;
    const { amount, walletId, categoryId, date, description } = req.body;

    try {
        let Model = type === 'income' ? Income : (type === 'expense' ? Expense : null);
        if (!Model) return res.status(400).json({ message: 'Type không hợp lệ' });

        const transaction = await Model.findById(id);
        if (!transaction) return res.status(404).json({ message: 'Không tìm thấy' });
        if (transaction.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Không có quyền' });

        const oldWallet = await Wallet.findById(transaction.wallet);
        if (oldWallet) {
            if (type === 'income') oldWallet.balance -= transaction.amount;
            if (type === 'expense') oldWallet.balance += transaction.amount;
            await oldWallet.save();
        }

        transaction.amount = Number(amount);
        transaction.wallet = walletId;
        transaction.category = categoryId;
        transaction.date = date;
        transaction.description = description;
        await transaction.save();

        const newWallet = await Wallet.findById(walletId);
        if (newWallet) {
            if (type === 'income') newWallet.balance += Number(amount);
            if (type === 'expense') newWallet.balance -= Number(amount);
            await newWallet.save();
        }

        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    const { type, id } = req.params;
    try {
        let transaction;
        if (type === 'income') transaction = await Income.findById(id);
        else if (type === 'expense') transaction = await Expense.findById(id);
        else return res.status(400).json({ message: 'Type không hợp lệ' });

        if (!transaction) return res.status(404).json({ message: 'Không tìm thấy' });
        if (transaction.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Không có quyền' });

        const wallet = await Wallet.findById(transaction.wallet);
        if (wallet) {
            if (type === 'income') wallet.balance -= transaction.amount;
            else if (type === 'expense') wallet.balance += transaction.amount;
            await wallet.save();
        }

        if (type === 'income') await Income.findByIdAndDelete(id);
        else await Expense.findByIdAndDelete(id);

        res.status(200).json({ message: 'Đã xóa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { addTransaction, getTransactions, updateTransaction, deleteTransaction };