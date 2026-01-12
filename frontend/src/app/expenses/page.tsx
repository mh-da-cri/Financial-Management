"use client";

import { useEffect, useState } from "react";
import { format, addMonths, subMonths, isSameDay, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, Pencil, Trash2, Filter } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCalendarData, DayData } from "@/lib/data-processing";
import { Transaction, Wallet, Category } from "@/types";
import axiosInstance from "@/services/axiosInstance";
import { useAlert } from "@/context/alert-context"; 

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function ExpensesPage() {
  const { showAlert } = useAlert(); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // State lọc danh mục
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");

  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [formData, setFormData] = useState<{
    amount: number | string;
    walletId: string;
    categoryId: string;
    date: string;
    description: string;
  }>({
    amount: "",
    walletId: "",
    categoryId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  const fetchData = async () => {
    try {
      const [resTrans, resWallets, resCats] = await Promise.all([
        axiosInstance.get("/transactions"),
        axiosInstance.get("/wallets"),
        axiosInstance.get("/categories"),
      ]);
      setTransactions(resTrans.data);
      setWallets(resWallets.data);
      setCategories(resCats.data.filter((c: Category) => c.type === 'expense'));
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cập nhật lại modal chi tiết ngày khi dữ liệu thay đổi
  useEffect(() => {
    if (selectedDay && isDayDialogOpen) {
      const filtered = filterCategoryId === "all" 
        ? transactions 
        : transactions.filter(t => t.category._id === filterCategoryId);
        
      const { calendarDays } = getCalendarData(filtered, currentMonth);
      const updatedDay = calendarDays.find(d => isSameDay(d.date, selectedDay.date));
      if (updatedDay) setSelectedDay(updatedDay);
    }
  }, [transactions, currentMonth, isDayDialogOpen, filterCategoryId]);

  const openAddForm = (dateObj: Date) => {
    setEditingTransaction(null);
    setIsDayDialogOpen(false); 
    setFormData({
      amount: "",
      walletId: "",
      categoryId: "",
      date: format(dateObj, "yyyy-MM-dd"), 
      description: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (t: Transaction) => {
    setEditingTransaction(t);
    setIsDayDialogOpen(false); 
    setFormData({
      amount: t.amount,
      walletId: t.wallet._id,
      categoryId: t.category._id,
      date: format(new Date(t.date), "yyyy-MM-dd"),
      description: t.description || "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.walletId || !formData.categoryId) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập đủ: số tiền, ví và danh mục!" });
    }

    try {
      // --- LOGIC TIMEZONE FIX (Quan trọng) ---
      // Tạo ngày mới từ string form và đặt giờ là 12:00 trưa
      const submitDate = new Date(formData.date);
      submitDate.setHours(12, 0, 0, 0);

      const payload = {
        type: "expense",
        walletId: formData.walletId,
        categoryId: formData.categoryId,
        amount: Number(formData.amount),
        date: submitDate, // Dùng ngày đã fix giờ
        description: formData.description,
      };

      if (editingTransaction) {
        await axiosInstance.put(`/transactions/expense/${editingTransaction._id}`, payload);
      } else {
        await axiosInstance.post("/transactions", payload);
      }

      setIsFormOpen(false);
      setIsDayDialogOpen(true); 
      fetchData(); 
    } catch (error: any) {
      showAlert({ title: "Lỗi", description: error.response?.data?.message || error.message });
    }
  };

  const handleDelete = (id: string) => {
    showAlert({
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa khoản chi này?",
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/transactions/expense/${id}`);
          fetchData();
        } catch (error: any) {
          showAlert({ title: "Lỗi", description: error.response?.data?.message || error.message });
        }
      }
    });
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredTransactions = transactions.filter(t => {
    if (filterCategoryId === "all") return true;
    return t.category._id === filterCategoryId;
  });

  const { calendarDays, paddingDays } = getCalendarData(filteredTransactions, currentMonth);
  
  const maxExpenseAmount = calendarDays.length > 0 
    ? Math.max(...calendarDays.map(d => d.totalExpense)) 
    : 0;

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData);
    setIsDayDialogOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Lịch Chi Tiêu</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
            {/* --- THANH LỌC DANH MỤC --- */}
            <div className="w-full sm:w-[200px]">
                <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                    <SelectTrigger className="bg-white">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Lọc danh mục" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></div>
                                    {c.name}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* THANH ĐIỀU HƯỚNG THÁNG */}
            <div className="flex items-center gap-4 bg-white p-1.5 rounded-lg border shadow-sm w-full sm:w-auto justify-between sm:justify-center">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-base font-medium min-w-[120px] text-center capitalize select-none">
                    {format(currentMonth, "MMMM yyyy", { locale: vi })}
                </span>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-muted-foreground">
            {filterCategoryId === "all" ? "Tổng quan toàn bộ chi tiêu" : "Chi tiết theo danh mục"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-gray-500">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-24 sm:h-32 bg-gray-50/50 rounded-md border border-dashed border-gray-200" />
            ))}

            {calendarDays.map((dayData, index) => {
              const isTodayDate = isToday(dayData.date);
              const isHighestExpense = maxExpenseAmount > 0 && dayData.totalExpense === maxExpenseAmount;

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dayData)}
                  className={`
                    relative h-24 sm:h-32 p-1 sm:p-2 rounded-md border cursor-pointer transition-all hover:shadow-md flex flex-col justify-between
                    ${dayData.totalExpense > 0 ? "bg-white border-red-200" : "bg-white border-gray-200"}
                    ${isTodayDate ? "ring-2 ring-blue-500 bg-blue-50/20" : ""} 
                    ${isHighestExpense ? "bg-red-50 border-red-300 ring-1 ring-red-200" : ""}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span 
                        className={`
                            text-xs sm:text-sm font-semibold flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full
                            ${isTodayDate ? "bg-blue-600 text-white shadow-md" : (dayData.totalExpense > 0 ? "text-gray-900" : "text-gray-400")}
                        `}
                    >
                      {dayData.dayOfMonth}
                    </span>

                    {isHighestExpense && (
                        <span className="hidden sm:inline-block text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full shadow-sm">
                            Cao nhất
                        </span>
                    )}
                  </div>

                  {dayData.totalExpense > 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1">
                      <span className="hidden sm:block text-[10px] text-gray-500">Chi tiêu</span>
                      <span className={`text-xs sm:text-sm font-bold truncate w-full text-center ${isHighestExpense ? "text-red-700 sm:text-base" : "text-red-600"}`}>
                        {formatCurrency(dayData.totalExpense)}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {dayData.transactions.length} GD
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                      -
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: CHI TIẾT NGÀY */}
      <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              Chi tiết ngày {selectedDay ? format(selectedDay.date, "dd/MM/yyyy") : ""}
            </DialogTitle>
            <DialogDescription className="text-center">
              Tổng chi: <span className="font-bold text-red-600">{selectedDay ? formatCurrency(selectedDay.totalExpense) : 0}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center my-2">
             <Button 
                onClick={() => selectedDay && openAddForm(selectedDay.date)} 
                className="bg-red-600 hover:bg-red-700 w-full"
             >
                <Plus className="mr-2 h-4 w-4" /> Thêm khoản chi vào ngày này
             </Button>
          </div>

          <ScrollArea className="max-h-[350px] w-full pr-4">
            <div className="space-y-3 mt-2">
              {selectedDay?.transactions && selectedDay.transactions.length > 0 ? (
                selectedDay.transactions.map((t) => (
                  <div key={t._id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white border shadow-sm"
                        style={{ color: t.category.color }}
                      >
                         <ShoppingCart className="h-5 w-5" /> 
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{t.category.name}</span>
                        <span className="text-xs text-gray-500">{t.description || "Không có ghi chú"}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-red-600">
                        -{formatCurrency(t.amount)}
                        </span>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditForm(t)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(t._id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Chưa có khoản chi tiêu nào.
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: FORM THÊM / SỬA */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingTransaction ? "Chỉnh sửa khoản chi" : "Thêm khoản chi"}</DialogTitle>
                <DialogDescription>
                    Ngày: {formData.date ? format(new Date(formData.date), "dd/MM/yyyy") : ""}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Số tiền</label>
                    <MoneyInput
                        value={formData.amount}
                        onValueChange={(val) => setFormData({...formData, amount: val})}
                        placeholder="VD: 50.000"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Danh mục</label>
                    <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((c) => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Từ ví</label>
                    <Select value={formData.walletId} onValueChange={(val) => setFormData({...formData, walletId: val})}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn ví thanh toán" />
                        </SelectTrigger>
                        <SelectContent>
                            {wallets.map((w) => (
                                <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Ghi chú</label>
                    <Input 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="VD: Ăn sáng, Mua xăng..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
                    {editingTransaction ? "Lưu thay đổi" : "Tạo khoản chi"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}