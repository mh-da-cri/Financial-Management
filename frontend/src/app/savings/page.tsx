"use client";

import { useEffect, useState } from "react";
import { Plus, Target, Trash2, Wallet as WalletIcon } from "lucide-react";
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

export default function SavingsPage() {
  const { showAlert } = useAlert(); 
  const [savings, setSavings] = useState<Saving[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);

  // --- SỬA LỖI TẠI ĐÂY ---
  // Khai báo rõ kiểu dữ liệu (number | string) cho các trường số tiền
  const [createForm, setCreateForm] = useState<{ name: string; targetAmount: number | string; color: string }>({ 
    name: "", 
    targetAmount: "", 
    color: "#10b981" 
  });
  
  const [depositForm, setDepositForm] = useState<{ walletId: string; amount: number | string }>({ 
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

  // --- XỬ LÝ TẠO HŨ ---
  const handleCreate = async () => {
    if (!createForm.name || !createForm.targetAmount) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập tên hũ và số tiền mục tiêu" });
    }
    try {
      await axiosInstance.post("/savings", {
        ...createForm,
        targetAmount: Number(createForm.targetAmount)
      });
      setIsCreateOpen(false);
      setCreateForm({ name: "", targetAmount: "", color: "#10b981" });
      fetchData();
    } catch (error) {
      showAlert({ title: "Lỗi", description: "Không thể tạo mục tiêu tiết kiệm" });
    }
  };

  // --- XỬ LÝ NẠP TIỀN ---
  const openDeposit = (saving: Saving) => {
    setSelectedSaving(saving);
    setDepositForm({ walletId: "", amount: "" });
    setIsDepositOpen(true);
  };

  const handleDeposit = async () => {
    if (!depositForm.walletId || !depositForm.amount) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng chọn ví và nhập số tiền" });
    }
    try {
      await axiosInstance.post(`/savings/${selectedSaving?._id}/deposit`, {
        walletId: depositForm.walletId,
        amount: Number(depositForm.amount)
      });
      setIsDepositOpen(false);
      fetchData();
    } catch (error: any) {
      showAlert({ title: "Lỗi nạp tiền", description: error.response?.data?.message || error.message });
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
        <Button onClick={() => setIsCreateOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Tạo mục tiêu mới
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {savings.map((saving) => {
          const percent = Math.min(100, Math.round((saving.currentAmount / saving.targetAmount) * 100));
          return (
            <Card key={saving._id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: saving.color }}></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <CardTitle className="text-lg">{saving.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Mục tiêu: {formatCurrency(saving.targetAmount)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => handleDelete(saving._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pl-6">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-green-600">{formatCurrency(saving.currentAmount)}</span>
                  <span>{percent}%</span>
                </div>
                <Progress value={percent} className="h-2" />
              </CardContent>
              <CardFooter className="pl-6 pt-0">
                <Button variant="outline" className="w-full mt-2" onClick={() => openDeposit(saving)}>
                  <WalletIcon className="mr-2 h-4 w-4" /> Nạp tiền vào hũ
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        
        {savings.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 border rounded-lg border-dashed">
            Bạn chưa có mục tiêu tiết kiệm nào. Hãy tạo một cái nhé!
          </div>
        )}
      </div>

      {/* DIALOG TẠO MỚI */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo mục tiêu tiết kiệm</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Tên mục tiêu</label>
              <Input placeholder="Mua xe, Cưới vợ..." value={createForm.name} onChange={(e) => setCreateForm({...createForm, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <label>Số tiền cần đạt</label>
              <MoneyInput 
                value={createForm.targetAmount} 
                onValueChange={(val) => setCreateForm({...createForm, targetAmount: val})} 
                placeholder="50.000.000"
              />
            </div>
            <div className="grid gap-2">
              <label>Màu sắc</label>
              <div className="flex gap-2">
                 <input type="color" className="h-10 w-20" value={createForm.color} onChange={(e) => setCreateForm({...createForm, color: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Tạo ngay</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG NẠP TIỀN */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nạp tiền vào: {selectedSaving?.name}</DialogTitle>
            <DialogDescription>Chuyển tiền từ ví của bạn vào hũ tiết kiệm này.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Chọn ví nguồn</label>
              <Select onValueChange={(val) => setDepositForm({...depositForm, walletId: val})}>
                <SelectTrigger><SelectValue placeholder="Chọn ví" /></SelectTrigger>
                <SelectContent>
                  {wallets.map(w => <SelectItem key={w._id} value={w._id}>{w.name} ({formatCurrency(w.balance)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label>Số tiền nạp</label>
              <MoneyInput 
                value={depositForm.amount} 
                onValueChange={(val) => setDepositForm({...depositForm, amount: val})} 
                placeholder="Nhập số tiền"
              />
            </div>
          </div>
          <DialogFooter><Button onClick={handleDeposit}>Xác nhận nạp</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}