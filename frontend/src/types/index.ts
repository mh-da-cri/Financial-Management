// types/index.ts

export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Wallet {
  _id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
}

export interface Transaction {
  _id: string;
  user: string;
  wallet: Wallet;   // Đã được populate từ controller
  category: Category; // Đã được populate từ controller
  amount: number;
  date: string;     // Dữ liệu từ API trả về thường là chuỗi ISO
  description?: string;
  type: 'income' | 'expense'; // Được thêm vào từ controller
}

export interface Saving {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}