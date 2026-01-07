"use client";

import { useEffect, useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";

import { calculateTotals, getPieChartData, getWeeklyChartData } from "@/lib/data-processing";
import { Transaction, Saving, Wallet } from "@/types";
import axiosInstance from "@/services/axiosInstance";

const currencyFormatter = (value: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE BỘ LỌC ---
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [pieMonth, setPieMonth] = useState<Date>(new Date());
  const [barDate, setBarDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTrans, resWallets] = await Promise.all([
          axiosInstance.get("/transactions"), 
          axiosInstance.get("/wallets"),     
        ]);
        setTransactions(resTrans.data);
        setWallets(resWallets.data);
        try {
           const resSavings = await axiosInstance.get("/savings");
           setSavings(resSavings.data);
        } catch (err) { setSavings([]); }
      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  const totals = calculateTotals(transactions, savings, wallets, filterWallet);
  const filteredTransactions = filterWallet === "all" 
      ? transactions 
      : transactions.filter(t => t.wallet && t.wallet._id === filterWallet);

  const pieData = getPieChartData(filteredTransactions, pieMonth);
  const barData = getWeeklyChartData(filteredTransactions, barDate);

  // Helper Component cho bộ lọc ngày
  const DateControl = ({ dateDisplay, onPrev, onNext, onSelectDate, mode = "single" }: any) => (
    <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-7 px-2 text-sm font-medium">
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
            {dateDisplay}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="end">
          <Calendar
            mode="single"
            selected={mode === 'month' ? undefined : new Date()}
            onSelect={(date) => date && onSelectDate(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex-1 space-y-6">
      {/* 1. TOP CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tổng Thu */}
        <Card className="border-none shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tổng Thu (Tháng)</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">$</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{currencyFormatter(totals.totalIncome)}</div>
          </CardContent>
        </Card>
        
        {/* Tổng Chi */}
        <Card className="border-none shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tổng Chi (Tháng)</CardTitle>
             <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold">−</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{currencyFormatter(totals.totalExpense)}</div>
          </CardContent>
        </Card>

        {/* Tiết Kiệm */}
        <Card className="border-none shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tiết Kiệm</CardTitle>
             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">S</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{currencyFormatter(totals.totalSavings)}</div>
          </CardContent>
        </Card>
        
        {/* Tổng Số Dư (ĐÃ SỬA LỖI UI TẠI ĐÂY) */}
        <Card className="bg-primary text-white border-none shadow-lg shadow-blue-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 whitespace-nowrap">Tổng Số Dư Ví</CardTitle>
            
            {/* CONTAINER ĐƯỢC CỐ ĐỊNH WIDTH */}
            <div className="w-[140px] flex justify-end">
              <Select value={filterWallet} onValueChange={setFilterWallet}>
                {/* THÊM CLASS TRUNCATE VÀO TRIGGER */}
                <SelectTrigger className="h-8 w-full text-xs bg-white/20 border-none text-white focus:ring-0 focus:ring-offset-0 px-3 [&>span]:truncate [&>span]:block [&>span]:w-full [&>span]:text-left">
                  <SelectValue placeholder="Tất cả ví" />
                </SelectTrigger>
                
                <SelectContent className="bg-white border-none shadow-lg">
                  <SelectItem value="all">Tất cả ví</SelectItem>
                  {wallets.map(w => (
                    <SelectItem key={w._id} value={w._id}>
                      {/* CẮT CHỮ TRONG MENU DROPDOWN LUÔN */}
                      <span className="truncate block max-w-[120px]" title={w.name}>{w.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter(totals.totalBalance)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* 2. BIỂU ĐỒ TRÒN */}
        <Card className="col-span-3 border-none shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">Cơ cấu Chi tiêu</CardTitle>
            <DateControl 
               dateDisplay={format(pieMonth, "MM/yyyy")}
               onPrev={() => setPieMonth(subMonths(pieMonth, 1))}
               onNext={() => setPieMonth(addMonths(pieMonth, 1))}
               onSelectDate={(date: Date) => setPieMonth(date)}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45} 
                      outerRadius={65} 
                      paddingAngle={5} 
                      label={(entry) => entry.name} 
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value) => currencyFormatter(Number(value))} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                  Không có dữ liệu chi tiêu tháng này
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. BIỂU ĐỒ CỘT */}
        <Card className="col-span-4 border-none shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">Biến động Tuần</CardTitle>
            <DateControl 
               dateDisplay={`${format(startOfWeek(barDate, { weekStartsOn: 1 }), "dd/MM")} - ${format(endOfWeek(barDate, { weekStartsOn: 1 }), "dd/MM")}`}
               onPrev={() => setBarDate(subWeeks(barDate, 1))}
               onNext={() => setBarDate(addWeeks(barDate, 1))}
               onSelectDate={(date: Date) => setBarDate(date)}
            />
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tickFormatter={(value) => `${value / 1000}k`} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    formatter={(value) => currencyFormatter(Number(value))} 
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) return `${label} (${payload[0].payload.fullDate})`;
                      return label;
                    }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle"/>
                  <Bar dataKey="Thu" fill="#4318FF" radius={[4, 4, 4, 4]} barSize={12} name="Thu nhập" />
                  <Bar dataKey="Chi" fill="#E60012" radius={[4, 4, 4, 4]} barSize={12} name="Chi tiêu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}