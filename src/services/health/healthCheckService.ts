import { FinancialHealthAssessment, HealthMetricItem, HealthActionSuggestion } from '../../types';

export interface HealthCheckInputs {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  emergencyFund: number;
  monthlyDebt: number;
}

export class FinancialHealthCheckService {
  public static calculateAssessment(inputs: HealthCheckInputs): FinancialHealthAssessment {
    const { monthlyIncome, monthlyExpense, monthlySavings, emergencyFund, monthlyDebt } = inputs;

    // 1. Cashflow Ratio
    const isCashflowPositive = monthlyIncome >= monthlyExpense;
    const cashflowRatio = monthlyExpense > 0 ? (monthlyIncome / monthlyExpense).toFixed(1) : '1.0';

    // 2. Savings Rate %
    const savingsRate =
      monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;

    // 3. Emergency Fund Coverage (in months)
    const emergencyMonths =
      monthlyExpense > 0 ? Number((emergencyFund / monthlyExpense).toFixed(1)) : 0;

    // 4. Debt Burden Ratio (Cicilan / Penghasilan)
    const debtBurdenRatio =
      monthlyIncome > 0 ? Math.round((monthlyDebt / monthlyIncome) * 100) : 0;

    // Metrics array
    const metrics: HealthMetricItem[] = [
      {
        key: 'cashflow',
        label: 'Arus Kas Bulanan',
        value: isCashflowPositive ? 'Surplus Terkendali' : 'Defisit Sementara',
        status: isCashflowPositive ? 'optimal' : 'attention',
        description: `Rasio pemasukan terhadap pengeluaran adalah ${cashflowRatio}x.`,
      },
      {
        key: 'savings_rate',
        label: 'Laju Tabungan',
        value: `${Math.max(0, savingsRate)}%`,
        status: savingsRate >= 20 ? 'optimal' : savingsRate >= 10 ? 'moderate' : 'attention',
        description:
          savingsRate >= 20
            ? 'Porsi tabungan di atas standar ideal 20% pemasukan.'
            : 'Masih ada ruang untuk perlahan mengalokasikan tabungan rutin.',
      },
      {
        key: 'emergency_fund',
        label: 'Ketahanan Dana Darurat',
        value: `${emergencyMonths} Bulan`,
        status: emergencyMonths >= 3 ? 'optimal' : emergencyMonths >= 1 ? 'moderate' : 'attention',
        description:
          emergencyMonths >= 3
            ? 'Cukup untuk menopang kebutuhan pokok keluarga selama beberapa bulan ke depan.'
            : 'Perlu diperkuat secara bertahap menuju target aman 3-6 bulan pengeluaran.',
      },
      {
        key: 'debt_burden',
        label: 'Beban Cicilan',
        value: `${debtBurdenRatio}%`,
        status: debtBurdenRatio <= 30 ? 'optimal' : debtBurdenRatio <= 40 ? 'moderate' : 'attention',
        description:
          debtBurdenRatio <= 30
            ? 'Beban cicilan berada di batas sehat (di bawah 30% pendapatan).'
            : 'Perlu perhatian agar tidak membatasi fleksibilitas cashflow harian.',
      },
    ];

    // Overall Status
    let overallStatus: 'Sangat Sehat' | 'Cukup Stabil' | 'Perlu Penyesuaian' = 'Cukup Stabil';
    let summaryHeadline = 'Kondisi keuangan keluarga cukup stabil dan terkendali.';
    let summaryDetail =
      'Pondasi dasar keuangan keluarga Anda sudah terbentuk dengan baik. Beberapa langkah kecil penyesuaian akan membuat masa depan terasa jauh lebih lega.';

    const attentionCount = metrics.filter((m) => m.status === 'attention').length;
    const optimalCount = metrics.filter((m) => m.status === 'optimal').length;

    if (optimalCount >= 3 && attentionCount === 0) {
      overallStatus = 'Sangat Sehat';
      summaryHeadline = 'Keuangan keluarga berada dalam kondisi sangat sehat dan tenang.';
      summaryDetail =
        'Pertahankan kebiasaan komunikasi yang terbuka ini dan teruskan langkah pencapaian target impian bersama pasangan.';
    } else if (attentionCount >= 2) {
      overallStatus = 'Perlu Penyesuaian';
      summaryHeadline = 'Ada beberapa ruang yang perlu diselaraskan bersama.';
      summaryDetail =
        'Tenang, semua keluarga pernah berada di fase ini. Fokuskan perhatian pada satu atau dua pos prioritas terlebih dahulu.';
    }

    // 3 Actionable Suggestions based on data
    const suggestions: HealthActionSuggestion[] = [];

    if (emergencyMonths < 3) {
      const topUpAmount = Math.round(monthlyIncome * 0.05);
      suggestions.push({
        id: 'sug-1',
        title: `Sisihkan Rp ${topUpAmount.toLocaleString('id-ID')}/bulan untuk Dana Darurat`,
        impact: 'Membantu keluarga mencapai ketahanan aman 3 bulan pengeluaran.',
        action_type: 'increase_emergency_fund',
        action_cta: 'Buat Target Dana Darurat',
      });
    }

    if (!isCashflowPositive || savingsRate < 15) {
      suggestions.push({
        id: 'sug-2',
        title: 'Tinjau pos pengeluaran makan di luar dan hiburan',
        impact: 'Dapat menghemat sekitar 5-10% kas keluarga tanpa mengurangi kebahagiaan.',
        action_type: 'reduce_category',
        action_cta: 'Buka Pengaturan Anggaran',
      });
    }

    suggestions.push({
      id: 'sug-3',
      title: 'Tingkatkan setoran target impian secara berkala',
      impact: 'Menjaga momentum pencapaian tujuan bersama tetap hidup.',
      action_type: 'boost_goal',
      action_cta: 'Lihat Target Impian',
    });

    return {
      overall_status: overallStatus,
      summary_headline: summaryHeadline,
      summary_detail: summaryDetail,
      metrics,
      suggestions: suggestions.slice(0, 3),
      assessed_at: new Date().toISOString(),
    };
  }
}
