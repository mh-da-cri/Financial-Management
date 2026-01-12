"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowRightLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "@/services/axiosInstance";
import { Wallet } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAlert } from "@/context/alert-context";

// Bảng màu mở rộng 30 màu sắc (3 hàng x 10 cột)
const PRESET_COLORS = [
  // Hàng 1: Các tông nóng (Đỏ, Cam, Vàng đậm)
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#a16207", 
  "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#b45309",
  
  // Hàng 2: Các tông lạnh (Xanh lá, Teal, Xanh dương)
  "#84cc16", "#22c55e", "#10b981", "#06b6d4", "#0ea5e9", 
  "#3b82f6", "#6366f1", "#4d7c0f", "#15803d", "#0f766e",
  
  // Hàng 3: Tím, Hồng và Trung tính
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", 
  "#e11d48", "#db2777", "#c026d3", "#71717a", "#000000"
];

export function WalletTab() {
  const { showAlert } = useAlert();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState<{ name: string; balance: number | string; color: string }>({ 
      name: "", balance: 0, color: "#000000" 
  });

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

  // --- LOGIC TỰ ĐỘNG CHỌN MÀU MỚI ---
  const openCreate = () => {
    setEditingWallet(null);
    
    // Lấy danh sách màu đã dùng
    const usedColors = wallets.map(w => w.color);
    // Lọc ra các màu chưa dùng
    const availableColors = PRESET_COLORS.filter(c => !usedColors.includes(c));
    
    // Nếu còn màu chưa dùng -> chọn ngẫu nhiên trong đó. Nếu hết -> chọn ngẫu nhiên trong tất cả.
    const randomColor = availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

    setFormData({ name: "", balance: 0, color: randomColor });
    setIsDialogOpen(true);
  };

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
            
            {/* GIAO DIỆN CHỌN MÀU MỚI */}
            <div className="grid gap-2">
              <label>Màu đại diện</label>
              <div className="grid grid-cols-10 gap-2 mt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      formData.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>{editingWallet ? "Lưu thay đổi" : "Tạo ví"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Transfer giữ nguyên */}
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