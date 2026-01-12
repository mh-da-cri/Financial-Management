import express from 'express';
import { 
    createPlan, 
    getPlans, 
    getPlanDetail, 
    deletePlan,
    updatePlan // Import thêm updatePlan
} from '../controllers/planController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getPlans)
    .post(createPlan);

router.route('/:id')
    .get(getPlanDetail)
    .put(updatePlan) // Thêm route sửa
    .delete(deletePlan);

export default router;