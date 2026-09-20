import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { generateMonthlyReviewData } from '../../services/insightEngine';
import { formatRupiah, formatShortRupiah } from '../../utils/formatters';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { Button } from '../../components/ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  PieChart,
  Target,
} from 'lucide-react';

interface MonthlyReviewViewProps {
  onAskAi: (prompt: string) => void;
}

export const MonthlyReviewView: React.FC<MonthlyReviewViewProps> = ({ onAskAi }) => {
  const { transactions, budgets, goals, categories } = useFinance();

  const [currentDate, setCurrentDate] = useState(() => new Date());

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Generate Review Data deterministically
  const reviewData = useMemo(() => {
    return generateMonthlyReviewData(transactions, budgets, goals, categories, month, year);
  }, [transactions, budgets, goals, categories, month, year]);

  // Donut SVG calculations
  const totalAmount = reviewData.totalExpense || 1;
  let accumulatedAngle = 0;

  const donutSegments = reviewData.topCategories.map((cat) => {
    const sliceAngle = (cat.amount / totalAmount) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += sliceAngle;
    return {
      ...cat,
      startAngle,
      sliceAngle,
    };
  });

  return (
    <div className="space-y-5 pb-6">
      {/* Month Navigator Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 shadow-sm flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-2xl hover:bg-[#E8F2EC] text-[#1F2937] transition-colors"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base font-bold text-[#1F2937]">
            {reviewData.monthName} {reviewData.year}
          </h2>
          <p className="text-xs text-[#6B7280]">Tinjauan Keuangan Bulanan</p>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-2xl hover:bg-[#E8F2EC] text-[#1F2937] transition-colors"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Donut Chart & Category Breakdown */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-center">
          Proporsi Pengeluaran Bulanan
        </h3>

        {/* Circular Donut Chart */}
        <div className="relative flex items-center justify-center py-2">
          <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
            {reviewData.topCategories.length === 0 ? (
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="transparent"
                stroke="#E8F2EC"
                strokeWidth="26"
              />
            ) : (
              donutSegments.map((segment) => {
                const strokeDash = (segment.amount / totalAmount) * (2 * Math.PI * 70);
                const strokeGap = 2 * Math.PI * 70 - strokeDash;
                const strokeOffset = -((segment.startAngle / 360) * (2 * Math.PI * 70));

                return (
                  <circle
                    key={segment.id}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth="24"
                    strokeDasharray={`${strokeDash} ${strokeGap}`}
                    strokeDashoffset={strokeOffset}
                    className="transition-all duration-700"
                  />
                );
              })
            )}
          </svg>

          {/* Center Donut Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-xl sm:text-2xl font-extrabold text-[#144D3A] leading-tight">
              {formatShortRupiah(reviewData.totalExpense)}
            </span>
            <span className="text-[11px] text-[#6B7280] mt-0.5 font-medium">
              total pengeluaran
            </span>
          </div>
        </div>

        {/* Category Breakdown List */}
        <div className="space-y-2.5 divide-y divide-[#E5E7EB] pt-2">
          {reviewData.topCategories.map((cat) => (
            <div key={cat.id} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold text-[#1F2937] truncate">{cat.name}</span>
              </div>

              <div className="flex items-center gap-4 shrink-0 pl-2">
                <span className="text-[#6B7280] w-10 text-right">{cat.percentage}%</span>
                <span className="font-bold text-[#144D3A] w-24 text-right">
                  {formatRupiah(cat.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cashflow Summary Card */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">Pemasukan</span>
          <span className="text-xs sm:text-sm font-bold text-[#22C55E] mt-1 block">
            {formatShortRupiah(reviewData.totalIncome)}
          </span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">Pengeluaran</span>
          <span className="text-xs sm:text-sm font-bold text-[#EF4444] mt-1 block">
            {formatShortRupiah(reviewData.totalExpense)}
          </span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-3.5 shadow-sm">
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">Sisa Kas</span>
          <span
            className={`text-xs sm:text-sm font-bold mt-1 block ${
              reviewData.netCashFlow >= 0 ? 'text-[#144D3A]' : 'text-[#EF4444]'
            }`}
          >
            {formatShortRupiah(reviewData.netCashFlow)}
          </span>
        </div>
      </div>

      {/* Smart Insights & AI Card */}
      <div className="bg-[#E8F2EC] border border-[#E8F2EC] rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#144D3A]" />
            <h4 className="text-sm font-bold text-[#144D3A]">Insight Cerdas LEGAKU</h4>
          </div>
          <span className="text-[10px] bg-[#144D3A] text-white px-2 py-0.5 rounded-full font-semibold">
            Otomatis
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {reviewData.insights.map((ins) => (
            <div
              key={ins.id}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 flex items-start gap-2.5"
            >
              <div className="w-2 h-2 rounded-full bg-[#144D3A] shrink-0 mt-1.5" />
              <div>
                <p className="font-bold text-[#1F2937]">{ins.title}</p>
                <p className="text-[#6B7280] mt-0.5 leading-relaxed">{ins.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1">
          <Button
            type="button"
            variant="primary"
            onClick={() => onAskAi('Bulan ini kita boros nggak?')}
            className="w-full text-xs h-11 rounded-2xl gap-2 font-semibold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D6C6AC]" />
            Tanya Lebih Lanjut ke LEGAKU AI
          </Button>
        </div>
      </div>
    </div>
  );
};
