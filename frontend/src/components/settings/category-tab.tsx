"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/services/axiosInstance";
import { Category } from "@/types";
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

export function CategoryTab() {
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [formData, setFormData] = useState({ 
    name: "", 
    type: "expense", 
    color: "#000000",
    icon: "circle" 
  });

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingCat) {
        await axiosInstance.put(`/categories/${editingCat._id}`, formData);
      } else {
        await axiosInstance.post("/categories", formData);
      }
      setIsDialogOpen(false);
      setEditingCat(null);
      setFormData({ name: "", type: "expense", color: "#000000", icon: "circle" });
      fetchCategories();
    } catch (error) {
      showAlert({ title: "Lỗi", description: "Lỗi khi lưu danh mục" });
    }
  };

  const handleDelete = (id: string) => {
    showAlert({
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa danh mục này?",
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/categories/${id}`);
          fetchCategories();
        } catch (error) {
          showAlert({ title: "Lỗi", description: "Lỗi khi xóa danh mục" });
        }
      }
    });
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon });
    setIsDialogOpen(true);
  };

  // --- LOGIC TỰ ĐỘNG CHỌN MÀU MỚI ---
  const openCreate = () => {
    setEditingCat(null);
    
    // Logic tương tự ví: Ưu tiên chọn màu chưa dùng
    const usedColors = categories.map(c => c.color);
    const availableColors = PRESET_COLORS.filter(c => !usedColors.includes(c));
    
    const randomColor = availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

    setFormData({ name: "", type: "expense", color: randomColor, icon: "circle" });
    setIsDialogOpen(true);
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Danh sách Danh mục</h3>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Thêm Danh mục
        </Button>
      </div>

      <div className="border rounded-md max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Danh mục</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat._id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {cat.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cat._id)}>
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
            <DialogTitle>{editingCat ? "Sửa Danh mục" : "Thêm Danh mục"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Tên danh mục</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ví dụ: Ăn sáng"
              />
            </div>
            
            <div className="grid gap-2">
              <label>Loại</label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => setFormData({...formData, type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Chi tiêu (Expense)</SelectItem>
                  <SelectItem value="income">Thu nhập (Income)</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleSubmit}>{editingCat ? "Lưu thay đổi" : "Tạo mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}