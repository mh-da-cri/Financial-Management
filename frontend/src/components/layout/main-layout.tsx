"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE]">
      <Sidebar />

      <div 
        className={cn(
            "flex flex-col transition-all duration-300 ease-in-out",
            // GIẢM MARGIN: ml-72 -> ml-64 (để khớp với sidebar w-64)
            "ml-64" 
        )}
      >
        <Header toggleSidebar={() => {}} isSidebarOpen={true} />
        
        <main className="flex-1 p-8">
            {children}
        </main>
      </div>
    </div>
  );
}