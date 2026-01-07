import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Wallet from '../models/walletModel.js';

// @desc    Thêm giao dịch mới (Thu hoặc Chi)
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
    const { type, walletId, categoryId, amount, date, description } = req.body;

    // Validate dữ liệu cơ bản
    if (!type || !walletId || !categoryId || !amount) {
        return res.status(400).json({ message: 'Vui lòng nhập đủ: loại, ví, danh mục, số tiền' });
    }

    try {
        // 1. Tìm ví để cập nhật số dư
        const wallet = await Wallet.findById(walletId);
        if (!wallet) {
            return res.status(404).json({ message: 'Không tìm thấy ví' });
        }

        // Kiểm tra quyền sở hữu ví
        if (wallet.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền sử dụng ví này' });
        }

        let transaction;

        // 2. Xử lý theo loại giao dịch
        if (type === 'income') {
            // --- THU NHẬP ---
            transaction = await Income.create({
                user: req.user._id,
                wallet: walletId,
                category: categoryId,
                amount,
                date: date || Date.now(),
                description
            });

            // Cộng tiền vào ví
            wallet.balance += Number(amount);

        } else if (type === 'expense') {
            // --- CHI TIÊU ---
            transaction = await Expense.create({
                user: req.user._id,
                wallet: walletId,
                category: categoryId,
                amount,
                date: date || Date.now(),
                description
            });

            // Trừ tiền khỏi ví
            wallet.balance -= Number(amount);

        } else {
            return res.status(400).json({ message: 'Type phải là income hoặc expense' });
        }

        // 3. Lưu số dư mới của ví
        await wallet.save();

        res.status(201).json(transaction);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy toàn bộ lịch sử giao dịch (Gộp cả Thu và Chi)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        // Lấy danh sách Thu và Chi song song
        const [incomes, expenses] = await Promise.all([
            Income.find({ user: req.user._id })
                .populate('wallet', 'name icon color')     // Lấy thêm tên ví
                .populate('category', 'name icon color'),  // Lấy thêm tên danh mục
            
            Expense.find({ user: req.user._id })
                .populate('wallet', 'name icon color')
                .populate('category', 'name icon color')
        ]);

        // Gắn thêm field "type" để Frontend biết đâu là thu, đâu là chi
        const incomesWithType = incomes.map(item => ({ ...item.toObject(), type: 'income' }));
        const expensesWithType = expenses.map(item => ({ ...item.toObject(), type: 'expense' }));

        // Gộp chung mảng
        const combinedTransactions = [...incomesWithType, ...expensesWithType];

        // Sắp xếp theo ngày (Mới nhất lên đầu)
        combinedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(combinedTransactions);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- HÀM MỚI: CẬP NHẬT GIAO DỊCH ---
// @desc    Sửa giao dịch
// @route   PUT /api/transactions/:type/:id
// @access  Private
const updateTransaction = async (req, res) => {
    const { type, id } = req.params;
    const { amount, walletId, categoryId, date, description } = req.body;

    try {
        let Model = type === 'income' ? Income : (type === 'expense' ? Expense : null);
        if (!Model) return res.status(400).json({ message: 'Type không hợp lệ' });

        // 1. Tìm giao dịch cũ
        const transaction = await Model.findById(id);
        if (!transaction) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        if (transaction.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Không có quyền' });

        // 2. Hoàn tác số dư trên ví CŨ
        const oldWallet = await Wallet.findById(transaction.wallet);
        if (oldWallet) {
            if (type === 'income') oldWallet.balance -= transaction.amount;
            if (type === 'expense') oldWallet.balance += transaction.amount;
            await oldWallet.save();
        }

        // 3. Cập nhật thông tin giao dịch
        transaction.amount = Number(amount);
        transaction.wallet = walletId;
        transaction.category = categoryId;
        transaction.date = date;
        transaction.description = description;
        await transaction.save();

        // 4. Áp dụng số dư mới lên ví MỚI (có thể là ví cũ nếu không đổi ví)
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

// @desc    Xóa giao dịch và hoàn tiền lại ví
// @route   DELETE /api/transactions/:type/:id
// @access  Private
const deleteTransaction = async (req, res) => {
    const { type, id } = req.params; // Lấy type và id từ URL

    try {
        let transaction;
        let wallet;

        // 1. Tìm giao dịch
        if (type === 'income') {
            transaction = await Income.findById(id);
        } else if (type === 'expense') {
            transaction = await Expense.findById(id);
        } else {
            return res.status(400).json({ message: 'Type không hợp lệ' });
        }

        if (!transaction) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }

        // Kiểm tra quyền
        if (transaction.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền xóa' });
        }

        // 2. Tìm ví để hoàn tiền
        wallet = await Wallet.findById(transaction.wallet);
        
        if (wallet) {
            // LOGIC HOÀN TIỀN:
            // Nếu xóa Thu nhập -> Phải TRỪ lại tiền trong ví
            if (type === 'income') {
                wallet.balance -= transaction.amount;
            } 
            // Nếu xóa Chi tiêu -> Phải CỘNG lại tiền vào ví
            else if (type === 'expense') {
                wallet.balance += transaction.amount;
            }
            await wallet.save();
        }

        // 3. Xóa giao dịch
        if (type === 'income') {
            await Income.findByIdAndDelete(id);
        } else {
            await Expense.findByIdAndDelete(id);
        }

        res.status(200).json({ message: 'Đã xóa giao dịch và cập nhật số dư ví' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export 
{ 
    addTransaction, 
    getTransactions, 
    updateTransaction, 
    deleteTransaction 
};