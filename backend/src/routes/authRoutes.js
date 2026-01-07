import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Định nghĩa endpoint đúng như yêu cầu
router.post('/signup', registerUser); // URI: /api/auth/signup
router.post('/login', loginUser);     // URI: /api/auth/login

export default router;