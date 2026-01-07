"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/services/axiosInstance";
import { Wallet } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAlert } from "@/context/alert-context"; // <--- Import Context

export function WalletTab() {
  const { showAlert } = useAlert(); // <--- Hook
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Dialog CRUD
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState<{ name: string; balance: number | string; color: string }>({ 
      name: "", balance: 0, color: "#000000" 
  });

  // State Dialog Transfer
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState<{ fromWalletId: string; toWalletId: string; amount: number | string }>({
      fromWalletId: "", toWalletId: "", amount: ""
  });

  const fetchWallets = async () => {
    try {
      const res = await axiosInstance.get("/wallets");
      setWallets(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // --- LOGIC CRUD VÍ ---
  const handleSubmit = async () => {
    try {
      if (editingWallet) {
        await axiosInstance.put(`/wallets/${editingWallet._id}`, formData);
      } else {
        await axiosInstance.post("/wallets", formData);
      }
      setIsDialogOpen(false);
      setEditingWallet(null);
      setFormData({ name: "", balance: 0, color: "#000000" });
      fetchWallets();
    } catch (error) {
      showAlert({ title: "Lỗi", description: "Không thể lưu ví, vui lòng thử lại." });
    }
  };

  const handleDelete = (id: string) => {
    // Thay confirm bằng showAlert
    showAlert({
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa ví này? Hành động này không thể hoàn tác.",
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/wallets/${id}`);
          fetchWallets();
        } catch (error) {
          showAlert({ title: "Lỗi", description: "Không thể xóa ví này." });
        }
      }
    });
  };

  const openEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({ name: wallet.name, balance: wallet.balance, color: wallet.color });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingWallet(null);
    setFormData({ name: "", balance: 0, color: "#10b981" });
    setIsDialogOpen(true);
  };

  // --- LOGIC CHUYỂN TIỀN ---
  const openTransfer = (sourceWallet: Wallet) => {
    setTransferData({ fromWalletId: sourceWallet._id, toWalletId: "", amount: "" });
    setIsTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferData.toWalletId || !transferData.amount) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng chọn ví đích và nhập số tiền" });
    }
    
    try {
        await axiosInstance.post("/wallets/transfer", {
            fromWalletId: transferData.fromWalletId,
            toWalletId: transferData.toWalletId,
            amount: Number(transferData.amount)
        });
        setIsTransferOpen(false);
        fetchWallets();
        showAlert({ title: "Thành công", description: "Chuyển tiền thành công!" });
    } catch (error: any) {
        showAlert({ title: "Lỗi chuyển tiền", description: error.response?.data?.message || error.message });
    }
  }

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Danh sách Ví tiền</h3>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Thêm Ví
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Ví</TableHead>
              <TableHead>Số dư hiện tại</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow key={wallet._id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: wallet.color }} />
                  {wallet.name}
                </TableCell>
                <TableCell>{formatCurrency(wallet.balance)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openTransfer(wallet)} title="Chuyển tiền">
                    <ArrowRightLeft className="h-4 w-4 text-orange-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(wallet)} title="Sửa">
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(wallet._id)} title="Xóa">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWallet ? "Sửa Ví" : "Thêm Ví Mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Tên ví</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ví dụ: Ví MoMo"
              />
            </div>
            <div className="grid gap-2">
              <label>Số dư ban đầu</label>
              <MoneyInput 
                value={formData.balance} 
                onValueChange={(val) => setFormData({...formData, balance: val})}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <label>Màu sắc</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="h-10 w-20 p-1 rounded border cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>{editingWallet ? "Lưu thay đổi" : "Tạo ví"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Chuyển tiền</DialogTitle>
                <DialogDescription>
                    Từ ví: <strong>{wallets.find(w => w._id === transferData.fromWalletId)?.name}</strong>
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <label>Đến ví</label>
                    <Select onValueChange={(val) => setTransferData({...transferData, toWalletId: val})}>
                        <SelectTrigger><SelectValue placeholder="Chọn ví đích" /></SelectTrigger>
                        <SelectContent>
                            {wallets
                                .filter(w => w._id !== transferData.fromWalletId)
                                .map(w => (
                                    <SelectItem key={w._id} value={w._id}>{w.name} ({formatCurrency(w.balance)})</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <label>Số tiền chuyển</label>
                    <MoneyInput 
                        value={transferData.amount} 
                        onValueChange={(val) => setTransferData({...transferData, amount: val})}
                        placeholder="Nhập số tiền"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleTransfer} className="bg-orange-600 hover:bg-orange-700">Xác nhận chuyển</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}