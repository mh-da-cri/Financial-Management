"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; // Thêm usePathname
import { LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context"; 

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Header({ toggleSidebar, isSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname(); // Lấy đường dẫn hiện tại
  const { user, isLoggedIn, logout } = useAuth(); 

  // Hàm lấy tên trang dựa trên đường dẫn
  const getPageTitle = (path: string) => {
    switch (path) {
      case "/":
        return "Dashboard";
      case "/expenses":
        return "Lịch chi tiêu";
      case "/incomes":
        return "Quản lý Thu nhập";
      case "/savings":
        return "Tiết kiệm & Mục tiêu";
      case "/settings":
        return "Cài đặt";
      case "/profile":
        return "Hồ sơ cá nhân";
      default:
        return "Dashboard"; // Mặc định
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-4">
        {/* SỬA: Thay chữ cứng "Dashboard" bằng hàm getPageTitle */}
        <span className="text-xl font-bold text-slate-800 tracking-tight pl-2">
            {getPageTitle(pathname)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isLoggedIn && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="@user" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56 bg-white border shadow-lg" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Hồ sơ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
             <Link href="/login">
                <Button variant="ghost">Đăng nhập</Button>
             </Link>
             <Link href="/signup">
                <Button className="bg-primary hover:bg-blue-700 text-white">Đăng ký</Button>
             </Link>
          </div>
        )}
      </div>
    </header>
  );
}