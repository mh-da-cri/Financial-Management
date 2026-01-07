"use client";

import { useEffect, useState } from "react";
import { format, subMonths, isSameMonth, eachMonthOfInterval } from "date-fns";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import axiosInstance from "@/services/axiosInstance";
import { Transaction, Wallet, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useAlert } from "@/context/alert-context"; // <--- Import

export default function IncomesPage() {
  const { showAlert } = useAlert(); // <--- Hook
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      setLoading(true);
      const [resTrans, resWallets, resCats] = await Promise.all([
        axiosInstance.get("/transactions"),
        axiosInstance.get("/wallets"),
        axiosInstance.get("/categories"),
      ]);

      const incomeList = resTrans.data.filter((t: Transaction) => t.type === "income");
      setIncomes(incomeList);
      
      setWallets(resWallets.data);
      setCategories(resCats.data.filter((c: Category) => c.type === "income"));

    } catch (error) {
      console.error("Lỗi tải dữ liệu thu nhập:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIncome = async () => {
    try {
      if (!formData.amount || !formData.walletId || !formData.categoryId) {
        return showAlert({ title: "Thiếu thông tin", description: "Vui lòng nhập đủ số tiền, ví và danh mục" });
      }

      await axiosInstance.post("/transactions", {
        type: "income",
        walletId: formData.walletId,
        categoryId: formData.categoryId,
        amount: Number(formData.amount),
        date: new Date(formData.date),
        description: formData.description,
      });

      setIsDialogOpen(false);
      setFormData({ ...formData, amount: "", description: "" });
      fetchData();
    } catch (error: any) {
      showAlert({ title: "Lỗi", description: error.response?.data?.message || error.message });
    }
  };

  // ... (Phần logic tính toán & UI Card/Chart giữ nguyên) ...
  const currentMonth = new Date();
  const lastMonth = subMonths(new Date(), 1);
  const thisMonthIncome = incomes.filter(t => isSameMonth(new Date(t.date), currentMonth)).reduce((sum, t) => sum + t.amount, 0);
  const lastMonthIncome = incomes.filter(t => isSameMonth(new Date(t.date), lastMonth)).reduce((sum, t) => sum + t.amount, 0);
  const percentChange = lastMonthIncome === 0 ? 100 : ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
  const chartData = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() }).map(date => {
    const total = incomes.filter(t => isSameMonth(new Date(t.date), date)).reduce((sum, t) => sum + t.amount, 0);
    return { name: format(date, "MM/yyyy"), amount: total };
  });

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Thu Nhập</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Thêm Thu Nhập
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tháng này</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthIncome)}</div><p className="text-xs text-muted-foreground mt-1 flex items-center">{percentChange >= 0 ? <TrendingUp className="mr-1 h-3 w-3 text-green-500" /> : <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}<span className={percentChange >= 0 ? "text-green-500" : "text-red-500"}>{Math.abs(percentChange).toFixed(1)}%</span>&nbsp;so với tháng trước</p></CardContent></Card>
         <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tháng trước</CardTitle><CalendarIcon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(lastMonthIncome)}</div><p className="text-xs text-muted-foreground mt-1">Tổng thu nhập đã chốt</p></CardContent></Card>
         <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Trung bình (6 tháng)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(chartData.reduce((sum, item) => sum + item.amount, 0) / 6)}</div><p className="text-xs text-muted-foreground mt-1">Ước tính thu nhập đều đặn</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader><CardTitle>Xu hướng Thu nhập</CardTitle></CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.amount === Math.max(...chartData.map(i => i.amount)) ? "#15803d" : "#86efac"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader><CardTitle>Lịch sử Thu nhập</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Ngày</TableHead><TableHead>Nguồn</TableHead><TableHead className="text-right">Số tiền</TableHead></TableRow></TableHeader>
              <TableBody>
                {incomes.slice(0, 6).map((income) => (
                  <TableRow key={income._id}>
                    <TableCell className="font-medium">{format(new Date(income.date), "dd/MM")}</TableCell>
                    <TableCell><div className="flex flex-col"><span>{income.category?.name || "Khác"}</span><span className="text-xs text-gray-500 truncate max-w-[100px]">{income.description}</span></div></TableCell>
                    <TableCell className="text-right text-green-600 font-bold">+{formatCurrency(income.amount)}</TableCell>
                  </TableRow>
                ))}
                {incomes.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-4">Chưa có dữ liệu</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ADD INCOME DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm khoản thu mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Số tiền</label>
              <div className="col-span-3">
                  <MoneyInput
                    value={formData.amount}
                    onValueChange={(val) => setFormData({ ...formData, amount: val })}
                    placeholder="5.000.000"
                  />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Nguồn thu</label>
              <div className="col-span-3">
                <Select onValueChange={(val) => setFormData({ ...formData, categoryId: val })}>
                  <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Về ví</label>
              <div className="col-span-3">
                <Select onValueChange={(val) => setFormData({ ...formData, walletId: val })}>
                  <SelectTrigger><SelectValue placeholder="Chọn ví nhận tiền" /></SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (<SelectItem key={wallet._id} value={wallet._id}>{wallet.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right text-sm font-medium">Ngày</label>
              <Input id="date" type="date" className="col-span-3" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="desc" className="text-right text-sm font-medium">Ghi chú</label>
              <Input id="desc" placeholder="Ví dụ: Lương tháng 10" className="col-span-3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700">Lưu khoản thu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}