"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; 
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings,
  Banknote,
  PiggyBank,
  ClipboardList
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Lịch chi tiêu", href: "/expenses", icon: CalendarDays },
    
    // --- SỬA ICON Ở ĐÂY ---
    { title: "Kế hoạch chi tiêu", href: "/plans", icon: ClipboardList }, 
    
    { title: "Thu nhập", href: "/incomes", icon: Banknote },
    { title: "Tiết kiệm", href: "/savings", icon: PiggyBank },
    { title: "Cài đặt", href: "/settings", icon: Settings }
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-white transition-all duration-300 ease-in-out shadow-soft"
      )}
    >
      {/* LOGO AREA */}
      <div className="flex h-20 items-center justify-center px-6 border-b border-gray-100/50">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 text-white font-bold text-lg shadow-lg shadow-blue-500/30">
             FM
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-slate-800 leading-none">Financial</span>
            <span className="text-xs font-medium text-slate-400">Management</span>
          </div>
        </div>
      </div>

      {/* MENU AREA */}
      <nav className="mt-6 flex flex-col gap-2 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-4 rounded-2xl p-3.5 transition-all duration-200 font-semibold text-sm",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-blue-500/20 translate-x-1" 
                  : "text-slate-500 hover:bg-gray-50 hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
              
              <span>{item.title}</span>
              
              {isActive && (
                 <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}