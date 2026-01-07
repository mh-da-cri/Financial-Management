import express from 'express';
import { 
    getWallets, 
    createWallet, 
    updateWallet, 
    deleteWallet,
    transferMoney // <--- Import thêm
} from '../controllers/walletController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Route chuyển tiền (Đặt trước route /:id để tránh bị nhầm id là 'transfer')
router.post('/transfer', transferMoney); 

router.route('/')
    .get(getWallets)
    .post(createWallet);

router.route('/:id')
    .put(updateWallet)
    .delete(deleteWallet);

export default router;