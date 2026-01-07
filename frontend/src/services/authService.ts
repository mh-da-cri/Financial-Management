import axiosInstance from './axiosInstance';
import Cookies from 'js-cookie';
import { 
  LoginPayload, 
  RegisterPayload, 
  AuthResponse, 
  User 
} from '@/types/auth'; 

const authService = {
  // Đăng ký
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/signup', data);
    
    if (response.data.token) {
      // THÊM: path: '/' để cookie có hiệu lực toàn trang
      Cookies.set('accessToken', response.data.token, { expires: 30, path: '/' }); 
    }
    return response.data;
  },

  // Đăng nhập
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    
    if (response.data.token) {
      // THÊM: path: '/'
      Cookies.set('accessToken', response.data.token, { expires: 30, path: '/' });
    }
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/users/me');
    return response.data; 
  },

  // Đăng xuất: Chỉ xóa cookie, việc chuyển trang để Context lo
  logout: () => {
    // THÊM: path: '/' để đảm bảo xóa đúng cookie đã tạo
    Cookies.remove('accessToken', { path: '/' });
  },
  
  isAuthenticated: () => {
    return !!Cookies.get('accessToken');
  }
};

export default authService;