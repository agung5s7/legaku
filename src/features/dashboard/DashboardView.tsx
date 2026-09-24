import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { formatRupiah, formatShortRupiah } from '../../utils/formatters';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { BrandIcon } from '../../components/ui/BrandIcon';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { Transaction } from '../../types';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Camera,
  Target,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  Bot,
  Users,
  ArrowRightLeft,
  Clock,
  HeartPulse,
  Compass,
  Mic,
  Wallet,
} from 'lucide-react';
import { analyzeFinancialPatterns } from '../../services/patterns/patternEngine';

interface DashboardViewProps {
  onOpenCatat: (mode?: 'manual' | 'receipt' | 'voice' | 'transfer') => void;
  onNavigateTab: (tab: 'home' | 'ai' | 'goal' | 'saya' | 'review' | 'accounts') => void;
  onViewAllTransactions: () => void;
  onOpenNotifications?: () => void;
  onOpenHealthCheck?: () => void;
  onOpenScenario?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCatat,
  onNavigateTab,
  onViewAllTransactions,
  onOpenHealthCheck,
  onOpenScenario,
}) => {
  const { profile } = useAuth();
  const { family, members } = useFamily();
  const {
    accounts,
    totalBalance,
    incomeThisMonth,
    expenseThisMonth,
    transactions,
    recurringTransactions,
    goals,
  } = useFinance();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [hideBalance, setHideBalance] = useState<boolean>(false);

  const smartPatterns = useMemo(() => analyzeFinancialPatterns(transactions), [transactions]);
  const recentTransactions = transactions.slice(0, 5);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dueRecurring = recurringTransactions.find(
    (r) => r.is_active && (r.next_occurrence <= todayStr || r.next_occurrence === tomorrowStr)
  );

  const topGoal = goals.length > 0 ? goals[0] : null;
  const goalProgress = topGoal ? Math.round((topGoal.current_amount / topGoal.target_amount) * 100) : 0;
  const netCashFlow = incomeThisMonth - expenseThisMonth;

  // Single primary factual insight
  const primaryInsight = useMemo(() => {
    if (smartPatterns.length > 0) {
      return {
        title: smartPatterns[0].title,
        description: smartPatterns[0].description,
        recommendation: smartPatterns[0].recommendation,
      };
    }
    if (netCashFlow > 0) {
      return {
        title: 'Arus Kas Positif',
        description: `Pemasukan bulan ini melampaui pengeluaran sebesar ${formatRupiah(netCashFlow)}.`,
        recommendation: 'Alokasikan sebagian sisa kas ke target impian keluarga.',
      };
    }
    if (netCashFlow < 0) {
      return {
        title: 'Perhatian Arus Kas',
        description: `Pengeluaran bulan ini melebihi pemasukan sebesar ${formatRupiah(Math.abs(netCashFlow))}.`,
        recommendation: 'Evaluasi pengeluaran di sisa bulan ini agar tetap terencana.',
      };
    }
    if (topGoal && goalProgress > 0) {
      return {
        title: 'Target Keuangan Berjalan',
        description: `Target "${topGoal.name}" telah mencapai ${goalProgress}% dari total kebutuhan.`,
        recommendation: 'Pertahankan konsistensi menabung untuk mencapai target.',
      };
    }
    return {
      title: 'Kondisi Keuangan Stabil',
      description: 'Tidak ada hal penting yang perlu diperhatikan hari ini.',
      recommendation: 'Pencatatan keuangan berjalan dengan baik.',
    };
  }, [netCashFlow, smartPatterns, topGoal, goalProgress]);

  return (
    <div className="space-y-5 pb-6 font-sans">
      {/* 1. Header: Greeting & Member Count Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight truncate">
            Halo, {profile?.full_name?.split(' ')[0] || 'Agung'} 👋
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5 font-medium leading-normal">
            Keluarga yang tenang dimulai dari uang yang lebih dipahami.
          </p>
        </div>

        {/* Member Count Pill Badge */}
        <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-2xl shadow-subtle shrink-0">
          <Users className="w-3.5 h-3.5 text-[#144D3A]" />
          <span className="text-xs font-bold text-[#1F2937]">
            {members.length} Anggota
          </span>
        </div>
      </div>

      {/* 2. Total Balance Card (Primary Hero) */}
      <div className="bg-[#144D3A] text-white rounded-3xl p-5 sm:p-6 shadow-card relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#2E7D61]/25 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-28 h-28 rounded-full bg-[#4CAF8A]/15 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E8F2EC]/90 tracking-wider uppercase">
              Total Saldo Keluarga
            </span>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-1.5 rounded-xl text-[#E8F2EC]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle Saldo Privacy"
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-none">
              {hideBalance ? '••••••••' : formatRupiah(totalBalance)}
            </div>
          </div>

          {/* Secondary Stats Row: Pemasukan, Pengeluaran, Arus Kas Bersih */}
          <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-white/15 text-xs">
            <div>
              <span className="text-[#E8F2EC]/75 text-[10px] sm:text-[11px] block font-medium">Pemasukan</span>
              <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
                {hideBalance ? '••••' : formatShortRupiah(incomeThisMonth)}
              </span>
            </div>
            <div>
              <span className="text-[#E8F2EC]/75 text-[10px] sm:text-[11px] block font-medium">Pengeluaran</span>
              <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block truncate">
                {hideBalance ? '••••' : formatShortRupiah(expenseThisMonth)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#E8F2EC]/75 text-[10px] sm:text-[11px] block font-medium">Arus Kas Bersih</span>
              <span className={`font-bold text-xs sm:text-sm mt-0.5 block truncate ${netCashFlow >= 0 ? 'text-[#4CAF8A]' : 'text-rose-300'}`}>
                {hideBalance ? '••••' : `${netCashFlow >= 0 ? '+' : ''}${formatShortRupiah(netCashFlow)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Hub (Catat, Transfer, Scan Struk, Bicara) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        <button
          onClick={() => onOpenCatat('manual')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[72px] bg-white border border-[#E5E7EB] rounded-2xl shadow-subtle hover:border-[#144D3A]/40 transition-all active:scale-95 group cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#1F2937] mt-1.5">Catat</span>
        </button>

        <button
          onClick={() => onOpenCatat('transfer')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[72px] bg-white border border-[#E5E7EB] rounded-2xl shadow-subtle hover:border-[#144D3A]/40 transition-all active:scale-95 group cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#1F2937] mt-1.5">Transfer</span>
        </button>

        {/* Scan Struk with subtle AI badge emphasis */}
        <button
          onClick={() => onOpenCatat('receipt')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[72px] bg-white border border-[#144D3A]/30 rounded-2xl shadow-subtle hover:border-[#144D3A] transition-all active:scale-95 group cursor-pointer relative overflow-hidden"
        >
          <span className="absolute top-1 right-1 px-1 py-0.2 rounded-[4px] bg-[#144D3A] text-white text-[8px] font-bold tracking-wider">
            AI
          </span>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#144D3A] text-white flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#144D3A] mt-1.5">Scan Struk</span>
        </button>

        <button
          onClick={() => onOpenCatat('voice')}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 min-h-[72px] bg-white border border-[#E5E7EB] rounded-2xl shadow-subtle hover:border-[#144D3A]/40 transition-all active:scale-95 group cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#1F2937] mt-1.5">Bicara</span>
        </button>
      </div>

      {/* 4. Proactive Bill Reminder (if due) */}
      {dueRecurring && (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 shadow-subtle flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#144D3A] bg-[#E8F2EC] px-2 py-0.5 rounded-full inline-block">
                Pengingat Tagihan
              </span>
              <p className="text-xs font-bold text-[#1F2937] truncate mt-1">
                {dueRecurring.description} ({formatRupiah(dueRecurring.amount)})
              </p>
              <p className="text-[11px] text-[#6B7280] truncate">
                Jatuh tempo {dueRecurring.next_occurrence <= todayStr ? 'hari ini' : 'besok'}.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenCatat('manual')}
            className="px-3.5 py-1.5 rounded-xl bg-[#144D3A] hover:bg-[#2E7D61] text-white text-xs font-semibold shrink-0 shadow-subtle transition-all active:scale-95 cursor-pointer"
          >
            Bayar
          </button>
        </div>
      )}

      {/* 5. Monthly Financial Summary */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1F2937]">Ringkasan Bulan Ini</h3>
          <button
            onClick={() => onNavigateTab('review')}
            className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-0.5 cursor-pointer"
          >
            {currentMonthName} {currentYear}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5 divide-y divide-[#E5E7EB]">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center text-xs">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-[#1F2937]">Pemasukan</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#144D3A]">
              {formatRupiah(incomeThisMonth)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center text-xs">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-[#1F2937]">Pengeluaran</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#1F2937]">
              {formatRupiah(expenseThisMonth)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-[#1F2937]">Arus Kas Bersih</span>
            </div>
            <span
              className={`text-xs sm:text-sm font-bold ${
                netCashFlow >= 0 ? 'text-[#144D3A]' : 'text-[#EF4444]'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}{formatRupiah(netCashFlow)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Single Primary AI Insight ("Insight untukmu") */}
      <div className="bg-[#E8F2EC]/70 border border-[#E5E7EB] rounded-3xl p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#144D3A]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#144D3A] text-white flex items-center justify-center shrink-0 shadow-subtle">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-bold text-[#144D3A]">Insight untukmu</h3>
          </div>
          <button
            onClick={() => onNavigateTab('ai')}
            className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] inline-flex items-center gap-0.5 cursor-pointer"
          >
            Tanya AI <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">
            {primaryInsight.title}
          </h4>
          <p className="text-xs text-[#4B5563] leading-relaxed font-normal">
            {primaryInsight.description}
          </p>
          {primaryInsight.recommendation && (
            <div className="mt-3 p-3 rounded-2xl bg-[#144D3A]/5 border border-[#144D3A]/10 flex items-start gap-2 text-xs">
              <span className="shrink-0 text-sm mt-0.5">💡</span>
              <p className="font-semibold text-[#144D3A] leading-relaxed flex-1">
                {primaryInsight.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Accounts & Wallets */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#144D3A]" />
            <h3 className="text-sm font-bold text-[#1F2937]">Rekening & Dompet</h3>
          </div>
          <button
            onClick={() => onNavigateTab('accounts')}
            className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-0.5 cursor-pointer"
          >
            Kelola <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {accounts.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#6B7280]">
              Belum ada rekening/dompet. Klik "Kelola" untuk menambahkan.
            </div>
          ) : (
            accounts.slice(0, 3).map((acc) => (
              <div
                key={acc.id}
                onClick={() => onNavigateTab('accounts')}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#E8F2EC]/40 border border-transparent hover:border-[#E8F2EC] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BrandIcon name={acc.name} type={acc.type} className="w-9 h-9 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1F2937] group-hover:text-[#144D3A] transition-colors truncate">
                      {acc.name}
                    </h4>
                    <p className="text-[10px] text-[#6B7280] uppercase font-semibold">
                      {acc.type === 'bank' ? 'Bank' : acc.type === 'ewallet' ? 'E-Wallet' : acc.type === 'cash' ? 'Tunai' : 'Lainnya'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs sm:text-sm font-bold text-[#144D3A]">
                    {formatRupiah(acc.current_balance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 8. Active Goal Progress Card */}
      {topGoal && (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#144D3A]" />
              <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">{topGoal.name}</h4>
            </div>
            <button
              onClick={() => onNavigateTab('goal')}
              className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-0.5 cursor-pointer"
            >
              Lihat Target <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">
              {formatRupiah(topGoal.current_amount)} dari {formatRupiah(topGoal.target_amount)}
            </span>
            <span className="font-bold text-[#144D3A]">{goalProgress}%</span>
          </div>

          <div className="w-full bg-[#E8F2EC] h-3 rounded-full overflow-hidden">
            <div
              className="bg-[#144D3A] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, goalProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* 9. Financial Health & Scenario Simulator ("Keuangan Lebih Terarah") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#1F2937]">Keuangan Lebih Terarah</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Cek Kesehatan Finansial */}
          <button
            type="button"
            onClick={onOpenHealthCheck}
            className="p-3.5 sm:p-4 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#144D3A]/40 text-left transition-all shadow-subtle group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937] leading-snug">
              Cek Kesehatan
            </h4>
            <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">
              Analisis rasio tabungan & dana darurat
            </p>
          </button>

          {/* Card 2: Simulator Skenario */}
          <button
            type="button"
            onClick={onOpenScenario}
            className="p-3.5 sm:p-4 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#144D3A]/40 text-left transition-all shadow-subtle group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-2xl bg-[#E8F2EC] text-[#2E7D61] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-[#1F2937] leading-snug">
              Simulator Skenario
            </h4>
            <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">
              Hitung estimasi pencapaian target
            </p>
          </button>
        </div>
      </div>

      {/* 10. Recent Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[#1F2937]">Transaksi Terakhir</h3>
          <button
            onClick={onViewAllTransactions}
            className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-0.5 cursor-pointer"
          >
            Lihat Semua ({transactions.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-subtle divide-y divide-[#E5E7EB]">
          {recentTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B7280]">
              Belum ada transaksi bulan ini. Klik Catat untuk memulai.
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isExp = tx.type === 'expense';
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#E8F2EC]/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isExp ? 'bg-[#E8F2EC] text-[#144D3A]' : 'bg-[#E8F2EC] text-[#2E7D61]'
                      }`}
                    >
                      <CategoryIcon name={tx.category_icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2937] truncate leading-tight">
                        {tx.description}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-1.5 leading-none">
                        <span>{tx.category_name}</span>
                        <span className="text-[#E5E7EB]">•</span>
                        <span>{tx.account_name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span
                      className={`text-sm font-bold flex items-center justify-end gap-0.5 ${
                        isExp ? 'text-[#1F2937]' : 'text-[#2E7D61]'
                      }`}
                    >
                      {isExp ? '-' : '+'}
                      {formatRupiah(tx.amount)}
                    </span>
                    {tx.creator_name && (
                      <span className="text-[10px] text-[#6B7280] block mt-0.5">
                        {tx.creator_name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
