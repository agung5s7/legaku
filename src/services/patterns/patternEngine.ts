import { Transaction, SmartPattern } from '../../types';

/**
 * LEGAKU Pattern Intelligence Engine
 * Identifies behavioral spending and savings patterns with warm, constructive framing.
 * Adheres strictly to the non-judgmental philosophy: "No financial shaming".
 */

export function analyzeFinancialPatterns(transactions: Transaction[]): SmartPattern[] {
  const patterns: SmartPattern[] = [];
  if (!transactions || transactions.length === 0) return patterns;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter(t => new Date(t.transaction_date) >= thirtyDaysAgo);
  const expenseTransactions = recentTransactions.filter(t => t.type === 'expense');
  const incomeTransactions = recentTransactions.filter(t => t.type === 'income');

  const totalExpense = expenseTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalIncome = incomeTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  // 1. Weekend vs Weekday spending pattern
  let weekendExpense = 0;
  let weekdayExpense = 0;
  let weekendCount = 0;
  let weekdayCount = 0;

  expenseTransactions.forEach(t => {
    const day = new Date(t.transaction_date).getDay();
    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    const amt = Number(t.amount || 0);
    if (isWeekend) {
      weekendExpense += amt;
      weekendCount++;
    } else {
      weekdayExpense += amt;
      weekdayCount++;
    }
  });

  const avgWeekendDaily = weekendCount > 0 ? weekendExpense / (weekendCount || 1) : 0;
  const avgWeekdayDaily = weekdayCount > 0 ? weekdayExpense / (weekdayCount || 1) : 0;

  if (avgWeekendDaily > avgWeekdayDaily * 1.4 && weekendExpense > 500000) {
    patterns.push({
      id: 'pattern_weekend_pulse',
      type: 'recurring_spending',
      pattern_type: 'weekend_spending_pulse',
      title: 'Ritme Akhir Pekan Keluarga',
      description: 'Pengeluaran di akhir pekan cenderung lebih aktif untuk momen santai bersama keluarga.',
      recommendation: 'Sisihkan pos khusus "Quality Time Akhir Pekan" agar tetap tenang tanpa khawatir mengganggu pos bulanan lainnya.',
      suggested_action: 'Sisihkan pos khusus Quality Time Akhir Pekan.',
      confidence: 0.85,
      confidence_score: 0.85,
      detected_at: new Date().toISOString(),
    });
  }

  // 2. Savings Rate Momentum Pattern
  if (totalIncome > 0) {
    const savingsRatio = (totalIncome - totalExpense) / totalIncome;
    if (savingsRatio >= 0.2) {
      patterns.push({
        id: 'pattern_healthy_savings',
        type: 'savings_trend',
        pattern_type: 'positive_savings_momentum',
        title: 'Momentum Menabung yang Sangat Sehat',
        description: `Bulan ini keluarga berhasil mengamankan ${(savingsRatio * 100).toFixed(0)}% dari arus kas masuk.`,
        recommendation: 'Pertahankan ritme ini. Pertimbangkan untuk memindahkan surplus ke target dana darurat atau impian keluarga.',
        suggested_action: 'Pindahkan surplus ke target dana darurat.',
        confidence: 0.95,
        confidence_score: 0.95,
        detected_at: new Date().toISOString(),
      });
    }
  }

  // 3. Category Concentration Check (Food & Dining or Groceries)
  const categoryMap = new Map<string, number>();
  expenseTransactions.forEach(t => {
    const cat = t.category_name || 'Lainnya';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount || 0));
  });

  categoryMap.forEach((amt, catName) => {
    if (totalExpense > 0 && (amt / totalExpense) > 0.4 && amt > 1500000) {
      patterns.push({
        id: `pattern_cat_dominant_${catName.toLowerCase().replace(/\s+/g, '_')}`,
        type: 'category_trend',
        pattern_type: 'category_concentration',
        title: `Alokasi Terbesar: ${catName}`,
        description: `Kategori ${catName} mengambil sekitar ${((amt / totalExpense) * 100).toFixed(0)}% dari total pengeluaran 30 hari terakhir.`,
        recommendation: 'Kategori ini menjadi pilar utama kebutuhan harian Anda. Evaluasi apakah sudah sesuai dengan prioritas keluarga.',
        suggested_action: 'Evaluasi kesesuaian kategori ini dengan prioritas.',
        confidence: 0.9,
        confidence_score: 0.9,
        detected_at: new Date().toISOString(),
      });
    }
  });

  // 4. Default Calm Encouragement Pattern if data is steady
  if (patterns.length === 0) {
    patterns.push({
      id: 'pattern_balanced_flow',
      type: 'savings_trend',
      pattern_type: 'balanced_cashflow',
      title: 'Arus Kas Berjalan Seimbang',
      description: 'Pengeluaran keluarga tercatat rapi dan mengalir wajar tanpa lonjakan drastis.',
      recommendation: 'Tetap catat transaksi rutin sesantai mungkin agar visualisasi tren bulanan semakin akurat.',
      suggested_action: 'Pertahankan pencatatan santai dan konsisten.',
      confidence: 0.8,
      confidence_score: 0.8,
      detected_at: new Date().toISOString(),
    });
  }

  return patterns;
}
