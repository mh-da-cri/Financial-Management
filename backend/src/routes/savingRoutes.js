import express from 'express';
import { 
    getSavings, 
    createSaving, 
    updateSaving,
    depositToSaving, 
    withdrawFromSaving,
    deleteSaving 
} from '../controllers/savingController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSavings)
    .post(createSaving);

router.route('/:id')
    .put(updateSaving) // <-- Thêm route sửa
    .delete(deleteSaving);

router.post('/:id/deposit', depositToSaving);
router.post('/:id/withdraw', withdrawFromSaving); // <-- Thêm route rút tiền

export default router;