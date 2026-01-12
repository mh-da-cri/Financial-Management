"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Plus, Calendar, Trash2, TrendingUp, Edit2, // Thêm icon Edit2
  CheckCircle2, PlusCircle, X 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import axiosInstance from "@/services/axiosInstance";
import { Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAlert } from "@/context/alert-context";

interface PlanSummary {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  remainingBalance: number; 
  totalSpent: number;
  details: { category: string; limitAmount: number }[]; // Thêm trường details để load vào form sửa
}

interface PlanItem {
  _id?: string;
  categoryName: string;
  categoryColor: string;
  limitAmount?: number;
  spentAmount: number;
  remaining?: number;
  progress?: number;
  isUnplanned?: boolean;
}

interface PlanDetail {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  totalSpent: number;
  remainingBalance: number;
  status: string;
  items: PlanItem[];
}

export default function PlansPage() {
  const { showAlert } = useAlert();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE CHI TIẾT KẾ HOẠCH ---
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- STATE FORM TẠO/SỬA ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // State lưu ID đang sửa

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    totalBudget: "" as string | number,
  });
  
  const [planDetails, setPlanDetails] = useState<{ categoryId: string; limitAmount: string | number }[]>([
    { categoryId: "", limitAmount: "" }
  ]);

  const fetchData = async () => {
    try {
      const [resPlans, resCats] = await Promise.all([
        axiosInstance.get("/plans"),
        axiosInstance.get("/categories"),
      ]);
      setPlans(resPlans.data);
      setCategories(resCats.data.filter((c: Category) => c.type === 'expense'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    setPlanDetails([...planDetails, { categoryId: "", limitAmount: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    const newDetails = [...planDetails];
    newDetails.splice(index, 1);
    setPlanDetails(newDetails);
  };

  const handleRowChange = (index: number, field: "categoryId" | "limitAmount", value: any) => {
    const newDetails = [...planDetails];
    // @ts-ignore
    newDetails[index][field] = value;
    setPlanDetails(newDetails);
  };

  const allocatedAmount = planDetails.reduce((sum, item) => sum + Number(item.limitAmount || 0), 0);
  const remainingBudget = Number(formData.totalBudget || 0) - allocatedAmount;

  // --- MỞ MODAL TẠO MỚI ---
  const openCreateModal = () => {
    setEditingId(null); // Reset mode sửa
    setFormData({ name: "", startDate: "", endDate: "", totalBudget: "" });
    setPlanDetails([{ categoryId: "", limitAmount: "" }]);
    setIsCreateOpen(true);
  };

  // --- MỞ MODAL SỬA ---
  const openEditModal = (e: React.MouseEvent, plan: PlanSummary) => {
    e.stopPropagation(); // Chặn sự kiện click vào card
    setEditingId(plan._id);
    
    // Fill dữ liệu cũ
    setFormData({
        name: plan.name,
        startDate: format(new Date(plan.startDate), "yyyy-MM-dd"), // Format lại ngày cho input type="date"
        endDate: format(new Date(plan.endDate), "yyyy-MM-dd"),
        totalBudget: plan.totalBudget
    });

    // Fill danh sách chi tiết (nếu có)
    if (plan.details && plan.details.length > 0) {
        setPlanDetails(plan.details.map(d => ({
            categoryId: d.category,
            limitAmount: d.limitAmount
        })));
    } else {
        setPlanDetails([{ categoryId: "", limitAmount: "" }]);
    }

    setIsCreateOpen(true);
  };

  // --- XỬ LÝ LƯU (TẠO HOẶC SỬA) ---
  const handleSubmit = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.totalBudget) {
      return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập tên, ngày và tổng ngân sách" });
    }

    const validDetails = planDetails
      .filter(d => d.categoryId && d.limitAmount)
      .map(d => ({ category: d.categoryId, limitAmount: Number(d.limitAmount) }));

    const payload = {
        ...formData,
        totalBudget: Number(formData.totalBudget),
        details: validDetails
    };

    try {
      if (editingId) {
        // Gọi API Sửa
        await axiosInstance.put(`/plans/${editingId}`, payload);
      } else {
        // Gọi API Tạo mới
        await axiosInstance.post("/plans", payload);
      }
      
      setIsCreateOpen(false);
      fetchData();
    } catch (error: any) {
      showAlert({ title: "Lỗi", description: "Không thể lưu kế hoạch" });
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await axiosInstance.get(`/plans/${id}`);
      setSelectedPlan(res.data);
      setIsDetailOpen(true);
    } catch (error) {
      showAlert({ title: "Lỗi", description: "Không thể tải chi tiết kế hoạch" });
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    showAlert({
      title: "Xác nhận xóa",
      description: "Bạn có chắc muốn xóa kế hoạch này?",
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/plans/${id}`);
          fetchData();
          if (selectedPlan?._id === id) setIsDetailOpen(false);
        } catch (error) {
          showAlert({ title: "Lỗi", description: "Không thể xóa kế hoạch" });
        }
      }
    });
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kế Hoạch Chi Tiêu</h2>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
          <Plus className="mr-2 h-4 w-4" /> Lập Kế Hoạch Mới
        </Button>
      </div>

      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        {plans.map((plan) => {
            const percent = plan.totalBudget > 0 ? Math.min(100, Math.round((plan.totalSpent / plan.totalBudget) * 100)) : 0;
            const isOverBudget = plan.remainingBalance < 0;
            const statusColor = isOverBudget ? "#ef4444" : "#22c55e"; 

            return (
              <Card 
                key={plan._id} 
                className="relative overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between cursor-pointer"
                onClick={() => handleViewDetail(plan._id)}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: statusColor }}></div>
                
                <CardHeader className="pb-1 pt-4">
                  <div className="flex justify-between items-start pl-3">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="flex items-center text-xs mt-0.5 text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(plan.startDate), "dd/MM")} - {format(new Date(plan.endDate), "dd/MM/yyyy")}
                      </CardDescription>
                    </div>
                    
                    {/* KHU VỰC NÚT THAO TÁC */}
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Nút Sửa */}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={(e) => openEditModal(e, plan)}>
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        {/* Nút Xóa */}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(plan._id, e)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pl-7 py-1">
                  <div className="flex justify-between items-end mb-1 font-medium">
                    <span className={`text-2xl font-bold tracking-tight ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(plan.remainingBalance ?? 0)}
                    </span>
                    <span className="text-xs text-muted-foreground mb-1">{percent}%</span>
                  </div>

                  <Progress 
                    value={percent} 
                    className="h-2.5" 
                    indicatorColor={statusColor} 
                  />
                  
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                      Ngân sách: {formatCurrency(plan.totalBudget)}
                  </p>
                </CardContent>
                
                <CardFooter className="pl-7 pt-1 pb-4">
                    <div className="w-full text-left text-xs text-blue-600 font-medium opacity-80 hover:opacity-100 hover:underline">
                        Xem chi tiết phân bổ →
                    </div>
                </CardFooter>
              </Card>
            );
        })}

        {plans.length === 0 && (
           <div className="col-span-full text-center py-10 text-gray-500 border rounded-lg border-dashed bg-gray-50">
             <TrendingUp className="h-10 w-10 text-gray-300 mb-2 mx-auto" />
             <p className="text-sm">Bạn chưa có kế hoạch chi tiêu nào.</p>
             <Button variant="link" className="mt-1 text-sm" onClick={openCreateModal}>Tạo kế hoạch ngay</Button>
           </div>
        )}
      </div>

      {/* --- DIALOG TẠO MỚI / CHỈNH SỬA (DÙNG CHUNG) --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh Sửa Kế Hoạch" : "Lập Kế Hoạch Chi Tiêu Mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Tên kế hoạch</label>
                    <Input placeholder="VD: Tuần 3 tháng 1..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Từ ngày</label>
                        <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Đến ngày</label>
                        <Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Tổng ngân sách (VND)</label>
                    <MoneyInput placeholder="VD: 5.000.000" value={formData.totalBudget} onValueChange={(val) => setFormData({...formData, totalBudget: val})} />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">Phân bổ ngân sách</h3>
                    <span className={`text-xs font-bold ${remainingBudget < 0 ? "text-red-500" : "text-green-600"}`}>
                        Còn lại: {formatCurrency(remainingBudget)}
                    </span>
                </div>
                <div className="space-y-2">
                    {planDetails.map((row, index) => (
                        <div key={index} className="flex gap-2 items-center">
                             <Select value={row.categoryId} onValueChange={(val) => handleRowChange(index, "categoryId", val)}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                                <SelectContent>{categories.map(c => (<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <div className="flex-1"><MoneyInput placeholder="Số tiền" value={row.limitAmount} onValueChange={(val) => handleRowChange(index, "limitAmount", val)} /></div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(index)} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-3 w-full border-dashed"><PlusCircle className="mr-2 h-4 w-4" /> Thêm danh mục</Button>
            </div>
          </div>
          <DialogFooter>
              <Button onClick={handleSubmit}>{editingId ? "Lưu thay đổi" : "Hoàn tất & Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG CHI TIẾT --- */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
          {selectedPlan && (
            <>
              <div className={`p-6 ${selectedPlan.remainingBalance < 0 ? "bg-red-50" : "bg-blue-50"}`}>
                 <DialogHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-gray-800">{selectedPlan.name}</DialogTitle>
                            <p className="text-sm text-gray-600 mt-1 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {format(new Date(selectedPlan.startDate), "dd/MM/yyyy")} - {format(new Date(selectedPlan.endDate), "dd/MM/yyyy")}
                            </p>
                        </div>
                        <div className="text-right bg-white/80 p-3 rounded-lg border border-gray-200 shadow-sm min-w-[180px]">
                             <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Số dư khả dụng</p>
                             <p className={`text-2xl font-bold mt-0.5 ${selectedPlan.remainingBalance < 0 ? "text-red-600" : "text-green-600"}`}>
                                {formatCurrency(selectedPlan.remainingBalance)}
                             </p>
                        </div>
                    </div>
                 </DialogHeader>

                 <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2 font-medium text-gray-700">
                        <span>Đã chi: <span className="font-bold">{formatCurrency(selectedPlan.totalSpent)}</span></span>
                        <span>Tổng ngân sách: <span className="font-bold">{formatCurrency(selectedPlan.totalBudget)}</span></span>
                    </div>
                    <Progress 
                        value={Math.min(100, (selectedPlan.totalSpent / selectedPlan.totalBudget) * 100)} 
                        className="h-3 bg-white border border-gray-100"
                        indicatorColor={selectedPlan.remainingBalance < 0 ? "#ef4444" : "#3b82f6"} 
                    />
                 </div>
              </div>

              <ScrollArea className="flex-1 p-6 bg-white">
                <h3 className="text-base font-bold mb-4 text-gray-800 flex items-center">
                    Chi tiết các khoản mục
                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                        {selectedPlan.items.length} mục
                    </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPlan.items.map((item, idx) => {
                        const percent = item.limitAmount && item.limitAmount > 0 
                            ? (item.spentAmount / item.limitAmount) * 100 
                            : 100;
                        
                        let statusColor = item.categoryColor; 
                        if(item.isUnplanned) statusColor = "#f97316"; 
                        else if (percent > 100) statusColor = "#ef4444"; 

                        return (
                            <div key={idx} className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.categoryColor }}></div>
                                        <div>
                                            <span className="block font-semibold text-gray-800 text-sm">{item.categoryName}</span>
                                            {item.isUnplanned && (
                                                <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 font-medium">
                                                    Phát sinh
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`block font-bold text-base ${percent > 100 ? "text-red-600" : "text-gray-900"}`}>
                                            {formatCurrency(item.spentAmount)}
                                        </span>
                                        {item.limitAmount && (
                                            <span className="text-xs text-gray-400">
                                                / {formatCurrency(item.limitAmount)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {!item.isUnplanned && (
                                    <>
                                        <Progress 
                                            value={Math.min(100, percent)} 
                                            className="h-1.5 mb-1" 
                                            indicatorColor={statusColor} 
                                        />
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-gray-500">
                                                {percent.toFixed(0)}%
                                            </span>
                                            <span className={`font-medium ${item.remaining! < 0 ? "text-red-500" : "text-green-600"}`}>
                                                {item.remaining! < 0 ? `Vượt: ${formatCurrency(Math.abs(item.remaining!))}` : `Còn: ${formatCurrency(item.remaining!)}`}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}