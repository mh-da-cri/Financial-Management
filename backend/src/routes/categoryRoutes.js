import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Bảo vệ tất cả routes bên dưới

router.route('/')
    .get(getCategories)
    .post(createCategory);

router.route('/:id')
    .put(updateCategory)
    .delete(deleteCategory);

export default router;