# 💰 Financial Management System
Hệ thống quản lý tài chính cá nhân (Personal Finance Dashboard) với giao diện hiện đại, giúp theo dõi thu chi, tiết kiệm và báo cáo thống kê trực quan.

## 🚀 Công nghệ sử dụng
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Recharts.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose).
- **Authentication:** JWT (JSON Web Token).

## 🛠️ Yêu cầu cài đặt
- [Node.js](https://nodejs.org/) (Phiên bản 18 trở lên).
- [MongoDB Atlas](https://www.mongodb.com/atlas) (Hoặc MongoDB cài trên máy).
- Git.

## 📦 Hướng dẫn cài đặt (Installation)
### 1. Clone dự án
Mở Terminal và chạy lệnh:
```bash
git clone [https://github.com/mh-da-cri/Financial-Management.git](https://github.com/mh-da-cri/Financial-Management.git)
cd Financial-Management
```  
### 2. Cài đặt Backend (Server)
Mở Terminal, truy cập vào thư mục backend và cài đặt các thư viện cần thiết:

```bash
cd backend
npm install
```     
**Cấu hình biến môi trường:**
Tạo file tên là `.env` trong thư mục `backend` và điền các thông tin sau:

```.env
PORT=5001
MONGO_URI=mongodb+srv://vonguyenminhhoang205_db_user:Q66IOsVqhCj2g7QU@cluster0.weusyts.mongodb.net/qlchitieu?appName=Cluster0
JWT_SECRET=nhap_mot_chuoi_ngau_nhien_bao_mat
FRONTEND_URL=http://localhost:3000
```
### 3. Cài đặt Frontend (Client)
```bash
cd frontend
npm install
``` 
**Cấu hình biến môi trường:**
Tạo file tên là `.env.local` trong thư mục `frontend` để kết nối với Backend:

```.env.local
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```
# ▶️ Hướng dẫn chạy (Run Local)
Để hệ thống hoạt động đầy đủ, bạn cần mở 2 cửa sổ Terminal chạy song song:
## Terminal 1: Khởi động Backend
```bash
cd backend
npm run dev
# Server sẽ chạy tại: http://localhost:5001
```
## Terminal 2: Khởi động Frontend
```bash
cd frontend
npm run dev
# Web sẽ chạy tại: http://localhost:3000
```