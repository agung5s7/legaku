import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { FinancialHealthCheckService } from '../../services/health/healthCheckService';
import { FinancialHealthAssessment } from '../../types';
import { ProductAnalytics } from '../../services/analytics/productAnalytics';
import {
  HeartPulse,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinancialHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncome?: number;
  currentExpense?: number;
  currentBalance?: number;
  onAskAi?: (prompt: string) => void;
  onAskAiCompanion?: (prompt: string) => void;
}

export const FinancialHealthCheckModal: React.FC<FinancialHealthCheckModalProps> = ({
  isOpen,
  onClose,
  currentIncome,
  currentExpense,
  currentBalance,
  onAskAi,
  onAskAiCompanion,
}) => {
  const { totalBalance, incomeThisMonth, expenseThisMonth } = useFinance();
  const effectiveIncome = currentIncome ?? incomeThisMonth;
  const effectiveExpense = currentExpense ?? expenseThisMonth;
  const effectiveBalance = currentBalance ?? totalBalance;
  const handleAsk = onAskAiCompanion || onAskAi;

  const [step, setStep] = useState<'input' | 'result'>('input');
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState<string>(
    incomeThisMonth > 0 ? formatRupiah(incomeThisMonth) : 'Rp 15.000.000'
  );
  const [monthlyExpenseInput, setMonthlyExpenseInput] = useState<string>(
    expenseThisMonth > 0 ? formatRupiah(expenseThisMonth) : 'Rp 8.000.000'
  );
  const [emergencyFundInput, setEmergencyFundInput] = useState<string>(
    totalBalance > 0 ? formatRupiah(totalBalance) : 'Rp 20.000.000'
  );
  const [monthlyDebtInput, setMonthlyDebtInput] = useState<string>('Rp 1.500.000');
  const [assessment, setAssessment] = useState<FinancialHealthAssessment | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    const inc = parseRupiahInput(monthlyIncomeInput);
    const exp = parseRupiahInput(monthlyExpenseInput);
    const ef = parseRupiahInput(emergencyFundInput);
    const debt = parseRupiahInput(monthlyDebtInput);

    const result = FinancialHealthCheckService.calculateAssessment({
      monthlyIncome: inc,
      monthlyExpense: exp,
      monthlySavings: Math.max(0, inc - exp),
      emergencyFund: ef,
      monthlyDebt: debt,
    });

    setAssessment(result);
    setStep('result');

    // Track analytics event
    ProductAnalytics.trackEvent('financial_health_check_completed', null, null, {
      status: result.overall_status,
    });

    confetti({
      particleCount: 25,
      spread: 55,
      origin: { y: 0.8 },
      colors: ['#467B60', '#8FB09A', '#C49744'],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sangat Sehat':
        return 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/20';
      case 'Cukup Stabil':
        return 'bg-[#F59E0B]/15 text-[#B45309] border-[#F59E0B]/20';
      default:
        return 'bg-[#E8F2EC] text-[#144D3A] border-[#E8F2EC]';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Health Check"
      subtitle="Refleksi damai untuk memahami kebugaran finansial keluarga secara objektif."
    >
      <div className="space-y-4">
        {step === 'input' && (
          <form onSubmit={handleCalculate} className="space-y-3.5 text-xs">
            <p className="text-[#6B7280] leading-relaxed">
              Isi perkiraan angka di bawah ini. Anda tidak perlu memasukkan angka persis jika belum tersedia.
            </p>

            <Input
              label="Perkiraan Pemasukan Bulanan"
              placeholder="Rp 0"
              value={monthlyIncomeInput}
              onChange={(e) =>
                setMonthlyIncomeInput(formatRupiah(parseRupiahInput(e.target.value)))
              }
              required
            />

            <Input
              label="Perkiraan Pengeluaran Bulanan Pokok"
              placeholder="Rp 0"
              value={monthlyExpenseInput}
              onChange={(e) =>
                setMonthlyExpenseInput(formatRupiah(parseRupiahInput(e.target.value)))
              }
              required
            />

            <Input
              label="Dana Darurat / Simpanan Kas Saat Ini"
              placeholder="Rp 0"
              value={emergencyFundInput}
              onChange={(e) =>
                setEmergencyFundInput(formatRupiah(parseRupiahInput(e.target.value)))
              }
            />

            <Input
              label="Total Cicilan / Kewajiban Rutin Bulanan"
              placeholder="Rp 0"
              value={monthlyDebtInput}
              onChange={(e) =>
                setMonthlyDebtInput(formatRupiah(parseRupiahInput(e.target.value)))
              }
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-semibold rounded-2xl shadow-sm"
              >
                Mulai Analisis Kesehatan Finansial
              </Button>
            </div>
          </form>
        )}

        {step === 'result' && assessment && (
          <div className="space-y-4">
            {/* Main Result Badge & Summary Card */}
            <div className="bg-[#E8F2EC] rounded-3xl p-5 text-center space-y-2.5">
              <span
                className={`inline-block text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${getStatusBadge(
                  assessment.overall_status
                )}`}
              >
                Kondisi Keuangan: {assessment.overall_status}
              </span>
              <h3 className="text-sm font-extrabold text-[#144D3A]">
                {assessment.summary_headline}
              </h3>
              <p className="text-xs text-[#1F2937]/80 leading-relaxed max-w-sm mx-auto">
                {assessment.summary_detail}
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {assessment.metrics.map((m) => (
                <div
                  key={m.key}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-sm space-y-1"
                >
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                    {m.label}
                  </span>
                  <span className="text-sm font-bold text-[#1F2937] block">{m.value}</span>
                  <p className="text-[10px] text-[#6B7280] leading-tight">{m.description}</p>
                </div>
              ))}
            </div>

            {/* 3 Actionable Suggestions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider px-1">
                3 Hal Yang Bisa Membuat Keuangan Lebih Lega
              </h4>
              <div className="space-y-2">
                {assessment.suggestions.map((sug, idx) => (
                  <div
                    key={sug.id}
                    className="p-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex items-start gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1F2937] leading-tight">
                        {sug.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">{sug.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask LEGAKU AI Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {handleAsk && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleAsk(
                      `Berdasarkan hasil Health Check keuangan kami yang berstatus "${assessment.overall_status}", apa saran langkah awal terbaik yang bisa kami diskusikan bersama pasangan?`
                    );
                    onClose();
                  }}
                  className="flex-1 text-xs gap-1.5 font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#144D3A]" />
                  Tanya Penjelasan AI
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                className="flex-1 text-xs font-bold"
              >
                Selesai & Simpan
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
