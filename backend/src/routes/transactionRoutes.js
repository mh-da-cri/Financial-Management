import express from 'express';
import { 
    addTransaction, 
    getTransactions, 
    deleteTransaction,
    updateTransaction // <--- Import thêm hàm này
} from '../controllers/transactionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .post(addTransaction)
    .get(getTransactions);

// Route xóa
router.delete('/:type/:id', deleteTransaction);

// Route sửa (MỚI)
router.put('/:type/:id', updateTransaction);

export default router;