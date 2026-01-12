// lib/data-processing.ts
import { Transaction, Saving, Wallet } from "@/types";
import { 
  eachDayOfInterval, 
  isSameDay, 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  getDay,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { vi } from "date-fns/locale";

export const calculateTotals = (
  transactions: Transaction[], 
  savings: Saving[], 
  wallets: Wallet[],
  filterWalletId?: string 
) => {
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  let filteredTransactions = transactions;
  let filteredWallets = wallets;

  if (filterWalletId && filterWalletId !== "all") {
    filteredTransactions = transactions.filter(t => t.wallet && t.wallet._id === filterWalletId);
    filteredWallets = wallets.filter(w => w._id === filterWalletId);
  }

  const monthlyTransactions = filteredTransactions.filter((t) => 
    isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd })
  );

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  const totalBalance = filteredWallets.reduce((sum, w) => sum + w.balance, 0);

  return { totalIncome, totalExpense, totalSavings, totalBalance };
};

export const getPieChartData = (transactions: Transaction[], selectedMonth: Date) => {
  const start = startOfMonth(selectedMonth); 
  const end = endOfMonth(selectedMonth);

  const expenseTransactions = transactions.filter(
    (t) => t.type === "expense" && isWithinInterval(new Date(t.date), { start, end })
  );

  const categoryMap: Record<string, { name: string; value: number; color: string }> = {};

  expenseTransactions.forEach((t) => {
    const catName = t.category.name;
    if (!categoryMap[catName]) {
      categoryMap[catName] = { 
        name: catName, 
        value: 0, 
        color: t.category.color || "#ccc" 
      };
    }
    categoryMap[catName].value += t.amount;
  });

  return Object.values(categoryMap).sort((a, b) => b.value - a.value);
};

export const getWeeklyChartData = (transactions: Transaction[], selectedDate: Date) => {
  const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); 
  const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start, end });

  return daysInWeek.map((day) => {
    // So sánh ngày dựa trên Local Time của trình duyệt
    const dayTransactions = transactions.filter((t) => isSameDay(new Date(t.date), day));
    
    const income = dayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    return {
      name: format(day, "EE", { locale: vi }), 
      fullDate: format(day, "dd/MM"),          
      Thu: income,
      Chi: expense,
      ChenhLech: income - expense
    };
  });
};

export interface DayData {
  date: Date;
  dayOfMonth: number;
  totalExpense: number;
  transactions: Transaction[];
  isCurrentMonth: boolean;
}

export const getCalendarData = (transactions: Transaction[], currentMonth: Date) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const data = daysInMonth.map((day) => {
    const dayTransactions = transactions.filter(
      (t) => t.type === "expense" && isSameDay(new Date(t.date), day)
    );
    const totalExpense = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      date: day,
      dayOfMonth: parseInt(format(day, "d")),
      totalExpense,
      transactions: dayTransactions,
      isCurrentMonth: true,
    };
  });

  // Logic padding cho lịch (để ô ngày 1 bắt đầu đúng thứ)
  let startDayIndex = getDay(monthStart); 
  // getDay trả về 0 là CN, 1 là T2. Ta muốn T2 là index 0
  startDayIndex = startDayIndex === 0 ? 6 : startDayIndex - 1;
  const paddingDays = Array(startDayIndex).fill(null);

  return { calendarDays: data, paddingDays };
};