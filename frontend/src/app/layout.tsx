import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layout/main-layout";
import { AuthProvider } from "@/context/auth-context";
import { AlertProvider } from "@/context/alert-context";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Financial Management", // <--- Đã đổi tên
  description: "Hệ thống quản lý tài chính cá nhân",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${jakarta.variable} font-sans antialiased bg-[#F4F7FE]`}>
        <AuthProvider>
          <AlertProvider>
            <MainLayout>
               {children}
            </MainLayout>
          </AlertProvider>
        </AuthProvider>
      </body>
    </html>
  );
}