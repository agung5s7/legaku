import {
  CategorySpendingBreakdown,
  FinancialInsight,
  MonthlyReviewData,
  Transaction,
  Budget,
  Goal,
  Category,
} from '../types';
import { formatRupiah } from '../utils/formatters';

const CATEGORY_COLORS: { [key: string]: string } = {
  'Makan & Minum': '#E5594F', // Coral
  'Rumah Tangga': '#5C8B72', // Sage green
  'Transportasi': '#3B82F6', // Blue
  'Belanja': '#EAB308',      // Amber
  'Tagihan': '#8B5CF6',      // Purple
  'Hiburan': '#06B6D4',      // Cyan
  'Kesehatan': '#EC4899',    // Pink
  'Pendidikan': '#10B981',   // Emerald
  'Keluarga': '#F97316',     // Orange
  'Lainnya': '#9CA3AF',      // Muted Gray
};

export function generateMonthlyReviewData(
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  categories: Category[],
  targetMonth: number,
  targetYear: number
): MonthlyReviewData {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
  const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

  let totalIncome = 0;
  let totalExpense = 0;
  let prevMonthExpense = 0;

  const currentCatExpenses = new Map<string, number>();
  const prevCatExpenses = new Map<string, number>();

  for (const tx of transactions) {
    const d = new Date(tx.transaction_date);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const amt = Number(tx.amount || 0);

    if (m === targetMonth && y === targetYear) {
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        currentCatExpenses.set(tx.category_id, (currentCatExpenses.get(tx.category_id) || 0) + amt);
      }
    } else if (m === prevMonth && y === prevYear) {
      if (tx.type === 'expense') {
        prevMonthExpense += amt;
        prevCatExpenses.set(tx.category_id, (prevCatExpenses.get(tx.category_id) || 0) + amt);
      }
    }
  }

  // Top Categories Breakdown
  const topCategories: CategorySpendingBreakdown[] = Array.from(currentCatExpenses.entries())
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const name = cat?.name || 'Lainnya';
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      const color = CATEGORY_COLORS[name] || '#6FA086';

      return {
        id: catId,
        name,
        icon: cat?.icon || 'Tag',
        amount,
        percentage,
        color,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Expense Change Percentage
  let expenseChangePercentage = 0;
  if (prevMonthExpense > 0) {
    expenseChangePercentage = Math.round(((totalExpense - prevMonthExpense) / prevMonthExpense) * 100);
  }

  // Budget Alerts
  const budgetAlerts = budgets
    .map((b) => {
      const spent = currentCatExpenses.get(b.category_id) || 0;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return {
        categoryName: b.category_name || 'Kategori',
        budget: b.amount,
        spent,
        percentage,
      };
    })
    .filter((b) => b.percentage >= 80);

  // Goal Highlights
  const goalHighlights = goals.map((g) => ({
    name: g.name,
    target: g.target_amount,
    current: g.current_amount,
    progress: g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0,
  }));

  // Deterministic Insights Engine
  const insights: FinancialInsight[] = [];

  // Insight 1: Cashflow Overview
  const netCashFlow = totalIncome - totalExpense;
  if (netCashFlow >= 0) {
    insights.push({
      id: 'ins-cf-pos',
      family_id: '',
      period_month: targetMonth,
      period_year: targetYear,
      insight_type: 'cashflow',
      title: 'Cashflow Positif',
      description: `Bulan ini keluarga berhasil mempertahankan surplus sebesar ${formatRupiah(netCashFlow)} yang aman dialokasikan ke tabungan.`,
      created_at: new Date().toISOString(),
    });
  } else {
    insights.push({
      id: 'ins-cf-def',
      family_id: '',
      period_month: targetMonth,
      period_year: targetYear,
      insight_type: 'cashflow',
      title: 'Perhatian Cashflow',
      description: `Pengeluaran melebihi pemasukan tercatat sebesar ${formatRupiah(Math.abs(netCashFlow))}. Ada baiknya meninjau pos belanja sekunder.`,
      created_at: new Date().toISOString(),
    });
  }

  // Insight 2: Category Delta
  if (topCategories.length > 0) {
    const highestCat = topCategories[0];
    const prevAmt = prevCatExpenses.get(highestCat.id) || 0;
    const diff = highestCat.amount - prevAmt;

    if (diff > 50000) {
      insights.push({
        id: `ins-cat-${highestCat.id}`,
        family_id: '',
        period_month: targetMonth,
        period_year: targetYear,
        insight_type: 'spending_increase',
        title: `Peningkatan ${highestCat.name}`,
        description: `Pengeluaran ${highestCat.name} meningkat ${formatRupiah(diff)} dibanding bulan lalu (${highestCat.percentage}% dari seluruh pengeluaran).`,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Insight 3: Budget Warnings
  if (budgetAlerts.length > 0) {
    const highestAlert = budgetAlerts[0];
    insights.push({
      id: 'ins-bgt-alert',
      family_id: '',
      period_month: targetMonth,
      period_year: targetYear,
      insight_type: 'budget_alert',
      title: 'Batas Anggaran Mendekat',
      description: `Anggaran ${highestAlert.categoryName} sudah terpakai ${highestAlert.percentage}% (${formatRupiah(highestAlert.spent)} dari ${formatRupiah(highestAlert.budget)}).`,
      created_at: new Date().toISOString(),
    });
  }

  return {
    month: targetMonth,
    year: targetYear,
    monthName: monthNames[targetMonth - 1],
    totalIncome,
    totalExpense,
    netCashFlow,
    prevMonthExpense,
    expenseChangePercentage,
    topCategories,
    budgetAlerts,
    goalHighlights,
    insights,
  };
}
