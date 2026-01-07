import express from 'express';
import { 
    getSavings, 
    createSaving, 
    depositToSaving, 
    deleteSaving 
} from '../controllers/savingController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSavings)
    .post(createSaving);

router.route('/:id')
    .delete(deleteSaving);

// Route đặc biệt để nạp tiền
router.post('/:id/deposit', depositToSaving);

export default router;