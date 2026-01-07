import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';

// Import Routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import savingRoutes from './src/routes/savingRoutes.js'; // <--- MỚI

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  // Chỉ định rõ địa chỉ Frontend Local của bạn
  origin: ["http://localhost:3000", "http://192.168.1.5:3000"], 
  credentials: true,               
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Sử dụng Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/savings', savingRoutes); // <--- MỚI

const PORT = process.env.PORT || 5001;

app.get('/', (req, res) => {
    res.send('API Quản lý chi tiêu đang chạy...');
});

app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});