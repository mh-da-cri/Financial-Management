import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
  withCredentials: true, // QUAN TRỌNG: Cho phép gửi kèm cookie HttpOnly của Backend
});

// --- REQUEST INTERCEPTOR ---
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ cookie 'accessToken' (Frontend quản lý)
    const token = Cookies.get('accessToken'); 
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
       // Logic logout tự động khi token hết hạn
       // Kiểm tra window để tránh lỗi server-side render
       if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          Cookies.remove('accessToken');
          // window.location.href = '/login'; 
       }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;