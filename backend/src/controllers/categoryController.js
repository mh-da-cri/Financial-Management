import Category from '../models/categoryModel.js';

// @desc    Lấy danh sách danh mục của user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
    try {
        // Lấy tất cả danh mục của user, sắp xếp danh mục mới tạo lên trước
        const categories = await Category.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Tạo danh mục mới
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Vui lòng nhập tên và loại danh mục (income/expense)' });
    }

    // Kiểm tra type hợp lệ
    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Loại danh mục không hợp lệ' });
    }

    try {
        const category = await Category.create({
            user: req.user._id,
            name,
            type,
            icon: icon || 'circle',
            color: color || '#000000'
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cập nhật danh mục
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        // Kiểm tra quyền sở hữu
        if (category.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền sửa danh mục này' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Xóa danh mục
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        if (category.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền xóa danh mục này' });
        }

        await category.deleteOne();
        res.status(200).json({ id: req.params.id, message: 'Đã xóa danh mục' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getCategories, createCategory, updateCategory, deleteCategory };