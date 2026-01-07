"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosInstance from "@/services/axiosInstance";
import { Category } from "@/types";
import { useAlert } from "@/context/alert-context"; // <--- Import

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

  const openCreate = () => {
    setEditingCat(null);
    setFormData({ name: "", type: "expense", color: "#ef4444", icon: "circle" });
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
            <Button onClick={handleSubmit}>{editingCat ? "Lưu thay đổi" : "Tạo mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}