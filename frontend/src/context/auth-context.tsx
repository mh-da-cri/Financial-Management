"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "@/services/authService";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; // <--- Import Router

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter(); // <--- Sử dụng Router

  const fetchUser = async () => {
    const token = Cookies.get("accessToken");
    if (!token) {
      setIsLoggedIn(false);
      setUser(null);
      return;
    }

    try {
      const userData = await authService.getMe();
      if (userData) {
        setUser({ 
          username: userData.username || "User", 
          email: userData.email || "" 
        });
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin User:", error);
      // Nếu lỗi (token hết hạn...), tự động logout luôn
      logout(); 
    }
  };

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
       setIsLoggedIn(true); 
       fetchUser();         
    }
  }, []);

  const login = (token: string) => {
    Cookies.set("accessToken", token, { expires: 30, path: '/' }); // Thêm path
    setIsLoggedIn(true);
    fetchUser();
  };

  const logout = () => {
    authService.logout(); // Xóa cookie
    setUser(null);        // Xóa state ngay lập tức
    setIsLoggedIn(false);
    router.push('/login'); // Chuyển trang bằng Next Router cho mượt
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, refreshAuth: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}