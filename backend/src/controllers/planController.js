import Plan from '../models/planModel.js';
import Expense from '../models/expenseModel.js'; 

// @desc    Tạo kế hoạch mới
const createPlan = async (req, res) => {
    const { name, startDate, endDate, totalBudget, details } = req.body;

    if (!name || !startDate || !endDate || !totalBudget) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin cơ bản' });
    }

    try {
        const plan = await Plan.create({
            user: req.user._id,
            name,
            startDate,
            endDate,
            totalBudget,
            details: details || [] 
        });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy danh sách kế hoạch (ĐÃ SỬA: Tính toán số dư)
const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ user: req.user._id }).sort({ startDate: -1 });

        const results = await Promise.all(plans.map(async (plan) => {
            const TIMEZONE_OFFSET = 7 * 60 * 60 * 1000;
            
            const start = new Date(plan.startDate); 
            start.setUTCHours(0,0,0,0);
            const startVN = new Date(start.getTime() - TIMEZONE_OFFSET);

            const end = new Date(plan.endDate); 
            end.setUTCHours(23,59,59,999);
            const endVN = new Date(end.getTime() - TIMEZONE_OFFSET);

            const expenses = await Expense.find({
                user: req.user._id,
                date: { $gte: startVN, $lte: endVN }
            }, 'amount'); 

            const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

            return {
                ...plan.toObject(),
                totalSpent, 
                remainingBalance: plan.totalBudget - totalSpent 
            };
        }));

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Lấy chi tiết kế hoạch
const getPlanDetail = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id).populate('details.category');
        
        if (!plan) return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
        if (plan.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Không có quyền' });

        const TIMEZONE_OFFSET = 7 * 60 * 60 * 1000;

        const start = new Date(plan.startDate); 
        start.setUTCHours(0,0,0,0);
        const startVN = new Date(start.getTime() - TIMEZONE_OFFSET); 

        const end = new Date(plan.endDate); 
        end.setUTCHours(23,59,59,999); 
        const endVN = new Date(end.getTime() - TIMEZONE_OFFSET); 

        const expenses = await Expense.find({
            user: req.user._id,
            date: { $gte: startVN, $lte: endVN }
        }).populate('category');

        let totalSpent = 0; 
        const expenseByCategory = {};
        expenses.forEach(t => {
            const catId = t.category._id.toString();
            expenseByCategory[catId] = (expenseByCategory[catId] || 0) + t.amount;
            totalSpent += t.amount;
        });

        const plannedDetails = plan.details.map(detail => {
            const catId = detail.category._id.toString();
            const spent = expenseByCategory[catId] || 0;
            delete expenseByCategory[catId];

            return {
                _id: detail._id,
                categoryName: detail.category.name,
                categoryColor: detail.category.color,
                limitAmount: detail.limitAmount,
                spentAmount: spent,
                remaining: detail.limitAmount - spent,
                progress: Math.min(100, Math.round((spent / detail.limitAmount) * 100))
            };
        });

        const unplannedDetails = [];
        const uniqueUnplannedCatIds = Object.keys(expenseByCategory);
        
        uniqueUnplannedCatIds.forEach(catId => {
            const trans = expenses.find(t => t.category._id.toString() === catId);
            if (trans) {
                unplannedDetails.push({
                    categoryName: trans.category.name,
                    categoryColor: trans.category.color,
                    spentAmount: expenseByCategory[catId],
                    isUnplanned: true 
                });
            }
        });

        const result = {
            _id: plan._id,
            name: plan.name,
            startDate: plan.startDate,
            endDate: plan.endDate,
            totalBudget: plan.totalBudget,
            totalSpent: totalSpent,
            remainingBalance: plan.totalBudget - totalSpent,
            status: (plan.totalBudget - totalSpent) < 0 ? 'Overbudget' : 'Good',
            items: [...plannedDetails, ...unplannedDetails] 
        };

        res.status(200).json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cập nhật kế hoạch (HÀM MỚI)
// @route   PUT /api/plans/:id
const updatePlan = async (req, res) => {
    const { name, startDate, endDate, totalBudget, details } = req.body;

    try {
        const plan = await Plan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
        }

        if (plan.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền' });
        }

        // Cập nhật thông tin
        plan.name = name || plan.name;
        plan.startDate = startDate || plan.startDate;
        plan.endDate = endDate || plan.endDate;
        // Kiểm tra totalBudget !== undefined để cho phép nhập số 0 nếu muốn
        plan.totalBudget = totalBudget !== undefined ? totalBudget : plan.totalBudget;
        plan.details = details || plan.details;

        const updatedPlan = await plan.save();
        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Xóa kế hoạch
const deletePlan = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Không tìm thấy' });
        if (plan.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Không có quyền' });

        await plan.deleteOne();
        res.status(200).json({ message: 'Đã xóa kế hoạch' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Nhớ export hàm updatePlan
export { createPlan, getPlans, getPlanDetail, deletePlan, updatePlan };