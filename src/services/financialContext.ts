import { Account, Budget, Category, Family, Goal, Transaction } from '../types';

export interface FamilyFinancialContext {
  familyName: string;
  totalBalance: number;
  accountsSummary: { name: string; type: string; balance: number }[];
  currentMonth: {
    monthName: string;
    income: number;
    expense: number;
    cashflow: number;
    savingsRate: number;
  };
  previousMonth: {
    income: number;
    expense: number;
    cashflow: number;
  };
  categoryBreakdown: { name: string; amount: number; percentage: number }[];
  budgetStatus: { category: string; budget: number; spent: number; usagePercent: number }[];
  goalsSummary: { name: string; current: number; target: number; progressPercent: number }[];
}

export function buildFamilyFinancialContext(
  family: Family | null,
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[]
): FamilyFinancialContext {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Accounts
  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.current_balance || 0), 0);
  const accountsSummary = accounts.map((a) => ({
    name: a.name,
    type: a.type,
    balance: Number(a.current_balance || 0),
  }));

  // Current Month vs Previous Month
  let curIncome = 0;
  let curExpense = 0;
  let prevIncome = 0;
  let prevExpense = 0;

  const categoryExpenseMap = new Map<string, number>();

  for (const tx of transactions) {
    const d = new Date(tx.transaction_date);
    const amt = Number(tx.amount || 0);

    if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
      if (tx.type === 'income') {
        curIncome += amt;
      } else {
        curExpense += amt;
        categoryExpenseMap.set(tx.category_id, (categoryExpenseMap.get(tx.category_id) || 0) + amt);
      }
    } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
      if (tx.type === 'income') {
        prevIncome += amt;
      } else {
        prevExpense += amt;
      }
    }
  }

  // Categories
  const categoryBreakdown = Array.from(categoryExpenseMap.entries())
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const percentage = curExpense > 0 ? Math.round((amount / curExpense) * 100) : 0;
      return {
        name: cat?.name || 'Lainnya',
        amount,
        percentage,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Budgets
  const budgetStatus = budgets.map((b) => {
    const spent = categoryExpenseMap.get(b.category_id) || 0;
    const usagePercent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    return {
      category: b.category_name || 'Kategori',
      budget: b.amount,
      spent,
      usagePercent,
    };
  });

  // Goals
  const goalsSummary = goals.map((g) => {
    const progressPercent = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
    return {
      name: g.name,
      current: g.current_amount,
      target: g.target_amount,
      progressPercent,
    };
  });

  const savingsRate = curIncome > 0 ? Math.max(0, Math.round(((curIncome - curExpense) / curIncome) * 100)) : 0;

  return {
    familyName: family?.name || 'Keluarga',
    totalBalance,
    accountsSummary,
    currentMonth: {
      monthName: monthNames[curMonth],
      income: curIncome,
      expense: curExpense,
      cashflow: curIncome - curExpense,
      savingsRate,
    },
    previousMonth: {
      income: prevIncome,
      expense: prevExpense,
      cashflow: prevIncome - prevExpense,
    },
    categoryBreakdown,
    budgetStatus,
    goalsSummary,
  };
}
