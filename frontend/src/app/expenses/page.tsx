"use client";

import { useEffect, useState } from "react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, Pencil, Trash2 } from "lucide-react";

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
import { useAlert } from "@/context/alert-context"; // <--- Import

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function ExpensesPage() {
  const { showAlert } = useAlert(); // <--- Hook
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    if (selectedDay && isDayDialogOpen) {
      const { calendarDays } = getCalendarData(transactions, currentMonth);
      const updatedDay = calendarDays.find(d => isSameDay(d.date, selectedDay.date));
      if (updatedDay) setSelectedDay(updatedDay);
    }
  }, [transactions, currentMonth, isDayDialogOpen]);

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
      const payload = {
        type: "expense",
        walletId: formData.walletId,
        categoryId: formData.categoryId,
        amount: Number(formData.amount),
        date: new Date(formData.date),
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

  const { calendarDays, paddingDays } = getCalendarData(transactions, currentMonth);
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData);
    setIsDayDialogOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Lịch Chi Tiêu</h2>
        
        <div className="flex gap-4">
            <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-medium min-w-[150px] text-center capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronRight className="h-5 w-5" />
            </button>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-gray-500">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="h-32 bg-gray-50/50 rounded-md border border-dashed border-gray-200" />
            ))}

            {calendarDays.map((dayData, index) => (
              <div
                key={index}
                onClick={() => handleDayClick(dayData)}
                className={`
                  relative h-32 p-2 rounded-md border cursor-pointer transition-all hover:shadow-md
                  ${dayData.totalExpense > 0 ? "bg-white border-red-200" : "bg-white border-gray-200"}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-semibold ${dayData.totalExpense > 0 ? "text-gray-900" : "text-gray-400"}`}>
                    {dayData.dayOfMonth}
                  </span>
                  {dayData.totalExpense > 0 && (
                     <div className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                </div>

                {dayData.totalExpense > 0 ? (
                  <div className="mt-4 flex flex-col items-center justify-center h-[calc(100%-24px)]">
                    <span className="text-xs text-gray-500">Chi tiêu</span>
                    <span className="text-sm font-bold text-red-600 truncate w-full text-center">
                      {formatCurrency(dayData.totalExpense)}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {dayData.transactions.length} giao dịch
                    </span>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                    -
                  </div>
                )}
              </div>
            ))}
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