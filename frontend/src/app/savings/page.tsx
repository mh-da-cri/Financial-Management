"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Trash2, Wallet as WalletIcon, Edit2, ArrowDownCircle, Check } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

import axiosInstance from "@/services/axiosInstance";
import { Saving, Wallet } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAlert } from "@/context/alert-context"; 

// Bảng màu 30 màu (Đồng bộ với Settings)
const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#a16207", 
  "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#b45309",
  "#84cc16", "#22c55e", "#10b981", "#06b6d4", "#0ea5e9", 
  "#3b82f6", "#6366f1", "#4d7c0f", "#15803d", "#0f766e",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", 
  "#e11d48", "#db2777", "#c026d3", "#71717a", "#000000"
];

export default function SavingsPage() {
  const { showAlert } = useAlert(); 
  const [savings, setSavings] = useState<Saving[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);

  // Form State
  const [form, setForm] = useState<{ name: string; targetAmount: number | string; color: string; isUnlimited: boolean }>({ 
    name: "", 
    targetAmount: "", 
    color: PRESET_COLORS[0],
    isUnlimited: false
  });
  
  const [transactionForm, setTransactionForm] = useState<{ walletId: string; amount: number | string }>({ 
    walletId: "", 
    amount: "" 
  });

  const fetchData = async () => {
    try {
      const [resSavings, resWallets] = await Promise.all([
        axiosInstance.get("/savings"),
        axiosInstance.get("/wallets"),
      ]);
      setSavings(resSavings.data);
      setWallets(resWallets.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MỞ MODAL TẠO (Auto-pick color) ---
  const openCreateModal = () => {
    // Logic tự động chọn màu chưa dùng
    const usedColors = savings.map(s => s.color);
    const availableColors = PRESET_COLORS.filter(c => !usedColors.includes(c));
    const randomColor = availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

    setForm({ name: "", targetAmount: "", color: randomColor, isUnlimited: false });
    setIsCreateOpen(true);
  }

  // --- MỞ MODAL SỬA ---
  const openEditModal = (saving: Saving) => {
    setSelectedSaving(saving);
    setForm({ 
      name: saving.name, 
      targetAmount: saving.targetAmount === 0 ? "" : saving.targetAmount, 
      color: saving.color || PRESET_COLORS[0],
      isUnlimited: saving.targetAmount === 0
    });
    setIsEditOpen(true);
  }

  // --- XỬ LÝ TẠO HŨ ---
  const handleCreate = async () => {
    if (!form.name) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập tên hũ" });
    }
    if (!form.isUnlimited && !form.targetAmount) {
       return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập số tiền mục tiêu hoặc chọn không giới hạn" });
    }

    try {
      await axiosInstance.post("/savings", {
        name: form.name,
        color: form.color,
        targetAmount: form.isUnlimited ? 0 : Number(form.targetAmount)
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      showAlert({ title: "Lỗi", description: "Không thể tạo mục tiêu tiết kiệm" });
    }
  };

  // --- XỬ LÝ CẬP NHẬT ---
  const handleUpdate = async () => {
    if (!selectedSaving) return;
    if (!form.name) return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập tên hũ" });
    
    try {
      await axiosInstance.put(`/savings/${selectedSaving._id}`, {
        name: form.name,
        color: form.color,
        targetAmount: form.isUnlimited ? 0 : Number(form.targetAmount)
      });
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      showAlert({ title: "Lỗi", description: "Không thể cập nhật mục tiêu" });
    }
  };

  // --- XỬ LÝ NẠP TIỀN ---
  const openDeposit = (saving: Saving) => {
    setSelectedSaving(saving);
    setTransactionForm({ walletId: "", amount: "" });
    setIsDepositOpen(true);
  };

  const handleDeposit = async () => {
    if (!transactionForm.walletId || !transactionForm.amount) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng chọn ví và nhập số tiền" });
    }
    try {
      await axiosInstance.post(`/savings/${selectedSaving?._id}/deposit`, {
        walletId: transactionForm.walletId,
        amount: Number(transactionForm.amount)
      });
      setIsDepositOpen(false);
      fetchData();
    } catch (error: any) {
      showAlert({ title: "Lỗi nạp tiền", description: error.response?.data?.message || error.message });
    }
  };

  // --- XỬ LÝ RÚT TIỀN ---
  const openWithdraw = (saving: Saving) => {
    setSelectedSaving(saving);
    setTransactionForm({ walletId: "", amount: "" });
    setIsWithdrawOpen(true);
  };

  const handleWithdraw = async () => {
    if (!transactionForm.walletId || !transactionForm.amount) {
       return showAlert({ title: "Thiếu thông tin", description: "Vui lòng chọn ví nhận tiền và nhập số tiền" });
    }
    try {
       await axiosInstance.post(`/savings/${selectedSaving?._id}/withdraw`, {
          walletId: transactionForm.walletId,
          amount: Number(transactionForm.amount)
       });
       setIsWithdrawOpen(false);
       fetchData();
    } catch (error: any) {
       showAlert({ title: "Lỗi rút tiền", description: error.response?.data?.message || error.message });
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = (id: string) => {
    showAlert({
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa mục tiêu này? Dữ liệu không thể phục hồi.",
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/savings/${id}`);
          fetchData();
        } catch (error) {
          showAlert({ title: "Lỗi", description: "Không thể xóa mục tiêu này" });
        }
      }
    });
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tiết Kiệm & Mục Tiêu</h2>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
          <Plus className="mr-2 h-4 w-4" /> Tạo Hũ Mới
        </Button>
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        {savings.map((saving) => {
          const isUnlimited = saving.targetAmount === 0;
          const percent = isUnlimited ? 100 : Math.min(100, Math.round((saving.currentAmount / saving.targetAmount) * 100));
          
          return (
            <Card key={saving._id} className="relative overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: saving.color }}></div>
              
              <CardHeader className="pb-1 pt-4">
                <div className="flex justify-between items-start pl-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        {saving.name}
                        {isUnlimited && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border">Không giới hạn</span>}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Mục tiêu: {isUnlimited ? "Tích lũy vô hạn" : formatCurrency(saving.targetAmount)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => openEditModal(saving)}>
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(saving._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pl-7 py-1">
                <div className="flex justify-between items-end mb-1 font-medium">
                  <span className="text-green-600 text-2xl font-bold tracking-tight">{formatCurrency(saving.currentAmount)}</span>
                  {!isUnlimited && <span className="text-xs text-muted-foreground mb-1">{percent}%</span>}
                </div>
                
                {!isUnlimited ? (
                    <Progress value={percent} className="h-2.5" indicatorColor={saving.color} />
                ) : (
                    <div className="h-2.5 w-full bg-transparent flex items-center">
                        <span className="text-[10px] text-gray-400 font-normal italic">Đang tích lũy tự do...</span>
                    </div>
                )}
              </CardContent>

              <CardFooter className="pl-7 pt-1 pb-4 gap-2">
                <Button variant="outline" className="flex-1 h-9 text-sm border-green-200 hover:bg-green-50 text-green-700 font-medium" onClick={() => openDeposit(saving)}>
                  <WalletIcon className="mr-2 h-3.5 w-3.5" /> Nạp tiền
                </Button>
                <Button variant="outline" className="flex-1 h-9 text-sm border-orange-200 hover:bg-orange-50 text-orange-700 font-medium" onClick={() => openWithdraw(saving)}>
                   <ArrowDownCircle className="mr-2 h-3.5 w-3.5" /> Rút tiền
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        
        {savings.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 border rounded-lg border-dashed bg-gray-50">
            <div className="flex flex-col items-center justify-center">
                <Target className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm">Bạn chưa có hũ tiết kiệm nào</p>
                <Button variant="link" onClick={openCreateModal} className="mt-1 text-primary text-sm">Tạo hũ đầu tiên ngay</Button>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG TẠO MỚI */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo hũ tiết kiệm mới</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên mục tiêu</label>
              <Input placeholder="VD: Mua xe, Đút heo..." value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                <input 
                    type="checkbox" 
                    id="unlimited" 
                    checked={form.isUnlimited} 
                    onChange={(e) => setForm({...form, isUnlimited: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="unlimited" className="text-sm font-medium leading-none cursor-pointer flex-1">
                    Không giới hạn số tiền (Tích lũy vô hạn)
                </label>
            </div>

            {!form.isUnlimited && (
                <div className="grid gap-2">
                <label className="text-sm font-medium">Số tiền cần đạt</label>
                <MoneyInput 
                    value={form.targetAmount} 
                    onValueChange={(val) => setForm({...form, targetAmount: val})} 
                    placeholder="50.000.000"
                />
                </div>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium">Màu sắc đại diện</label>
              <div className="grid grid-cols-10 gap-2 mt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      form.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {form.color === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Hoàn tất</Button></DialogFooter>
        </DialogContent>
      </Dialog>

       {/* DIALOG CHỈNH SỬA */}
       <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chỉnh sửa hũ tiết kiệm</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên mục tiêu</label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
                <input 
                    type="checkbox" 
                    id="edit-unlimited" 
                    checked={form.isUnlimited} 
                    onChange={(e) => setForm({...form, isUnlimited: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="edit-unlimited" className="text-sm font-medium cursor-pointer flex-1">
                    Không giới hạn (Tắt mục tiêu)
                </label>
            </div>

            {!form.isUnlimited && (
                <div className="grid gap-2">
                <label className="text-sm font-medium">Số tiền cần đạt</label>
                <MoneyInput 
                    value={form.targetAmount} 
                    onValueChange={(val) => setForm({...form, targetAmount: val})} 
                />
                </div>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium">Màu sắc</label>
              <div className="grid grid-cols-10 gap-2 mt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      form.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {form.color === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleUpdate}>Lưu thay đổi</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG NẠP TIỀN */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nạp tiền vào: {selectedSaving?.name}</DialogTitle>
            <DialogDescription>Chuyển tiền từ ví của bạn vào hũ này.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Chọn ví nguồn</label>
              <Select onValueChange={(val) => setTransactionForm({...transactionForm, walletId: val})}>
                <SelectTrigger><SelectValue placeholder="Chọn ví" /></SelectTrigger>
                <SelectContent>
                  {wallets.map(w => <SelectItem key={w._id} value={w._id}>{w.name} ({formatCurrency(w.balance)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Số tiền nạp</label>
              <MoneyInput 
                value={transactionForm.amount} 
                onValueChange={(val) => setTransactionForm({...transactionForm, amount: val})} 
                placeholder="Nhập số tiền"
              />
            </div>
          </div>
          <DialogFooter><Button onClick={handleDeposit}>Xác nhận nạp</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG RÚT TIỀN */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rút tiền từ: {selectedSaving?.name}</DialogTitle>
            <DialogDescription>Rút tiền từ hũ này về ví chi tiêu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Chọn ví nhận tiền</label>
              <Select onValueChange={(val) => setTransactionForm({...transactionForm, walletId: val})}>
                <SelectTrigger><SelectValue placeholder="Chọn ví nhận" /></SelectTrigger>
                <SelectContent>
                  {wallets.map(w => <SelectItem key={w._id} value={w._id}>{w.name} ({formatCurrency(w.balance)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Số tiền rút</label>
              <MoneyInput 
                value={transactionForm.amount} 
                onValueChange={(val) => setTransactionForm({...transactionForm, amount: val})} 
                placeholder="Tối đa: số dư hiện tại"
              />
              <p className="text-xs text-muted-foreground">Số dư hũ: {selectedSaving ? formatCurrency(selectedSaving.currentAmount) : 0}</p>
            </div>
          </div>
          <DialogFooter><Button variant="destructive" onClick={handleWithdraw}>Xác nhận rút</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}