import React, { useState, useMemo } from 'react';
import { Sparkles, TrendingUp, Calendar, CheckCircle2, ChevronRight, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Goal } from '../../types';
import { runScenarioSimulation } from '../../services/simulation/scenarioSimulator';
import { formatRupiah } from '../../utils/formatters';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  currentMonthlySavings?: number;
  onAskAiCompanion?: (prompt: string) => void;
}

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  goals,
  currentMonthlySavings = 2500000,
  onAskAiCompanion,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [extraMonthlySavings, setExtraMonthlySavings] = useState<number>(500000);
  const [reducedExpense, setReducedExpense] = useState<number>(200000);
  const [oneTimeBoost, setOneTimeBoost] = useState<number>(0);

  const selectedGoal = useMemo(() => {
    return goals.find(g => g.id === selectedGoalId) || goals[0];
  }, [goals, selectedGoalId]);

  const simulation = useMemo(() => {
    if (!selectedGoal) return null;
    return runScenarioSimulation(selectedGoal, {
      extraMonthlySavings,
      reducedExpenseMonthly: reducedExpense,
      oneTimeBoost,
      baseMonthlySavings: currentMonthlySavings,
    });
  }, [selectedGoal, extraMonthlySavings, reducedExpense, oneTimeBoost, currentMonthlySavings]);

  if (!isOpen) return null;

  const handleAskAI = () => {
    if (!onAskAiCompanion || !simulation || !selectedGoal) return;
    const prompt = `Halo LEGAKU, saya sedang menyimulasikan target impian "${selectedGoal.name}". Jika menambah tabungan Rp ${extraMonthlySavings.toLocaleString('id-ID')} dan memangkas pengeluaran Rp ${reducedExpense.toLocaleString('id-ID')}, target ini bisa tercapai ${simulation.monthsSaved} bulan lebih cepat (${simulation.simulatedMonthsNeeded} bulan). Apa strategi terbaik bagi keluarga kami agar konsisten?`;
    onAskAiCompanion(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-emerald-100">
        {/* Header */}
        <div className="bg-[#144D3A] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-[#D6C6AC]" />
            Simulator Skenario Impian
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Eksplorasi Skenario Keuangan</h2>
          <p className="text-white/80 text-xs mt-1 leading-relaxed">
            Lihat bagaimana langkah kecil konsisten mempercepat impian keluarga Anda secara pasti.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#1F2937]">
          {/* Target Selection */}
          <div>
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">
              Pilih Target Keluarga
            </label>
            {goals.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] italic">Belum ada target impian tersimpan.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      (selectedGoal?.id === goal.id)
                        ? 'border-[#144D3A] bg-[#E8F2EC] text-[#144D3A] font-medium ring-2 ring-[#144D3A]/20 shadow-sm'
                        : 'border-[#E5E7EB] hover:border-[#9CA3AF] bg-white text-[#1F2937]'
                    }`}
                  >
                    <div className="text-sm font-semibold truncate">{goal.name}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {formatRupiah(goal.current_amount)} / {formatRupiah(goal.target_amount)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Simulation Chips */}
          <div className="space-y-4">
            {/* Tambahan Tabungan */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Tambah Tabungan Bulanan
                </label>
                <span className="text-xs font-bold text-[#144D3A] bg-[#E8F2EC] px-2 py-0.5 rounded-full">
                  +{formatRupiah(extraMonthlySavings)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 250000, 500000, 1000000, 2000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setExtraMonthlySavings(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      extraMonthlySavings === val
                        ? 'bg-[#144D3A] border-[#144D3A] text-white shadow-sm'
                        : 'bg-[#F9FAF7] border-[#E5E7EB] text-[#1F2937] hover:bg-[#E8F2EC]'
                    }`}
                  >
                    {val === 0 ? 'Rp 0' : `+${formatRupiah(val)}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Pangkas Pengeluaran Santai */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Pangkas Pengeluaran Opsional
                </label>
                <span className="text-xs font-bold text-[#144D3A] bg-[#E8F2EC] px-2 py-0.5 rounded-full">
                  -{formatRupiah(reducedExpense)}/bln
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 100000, 200000, 500000, 1000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReducedExpense(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      reducedExpense === val
                        ? 'bg-[#144D3A] border-[#144D3A] text-white shadow-sm'
                        : 'bg-[#F9FAF7] border-[#E5E7EB] text-[#1F2937] hover:bg-[#E8F2EC]'
                    }`}
                  >
                    {val === 0 ? 'Rp 0' : `-${formatRupiah(val)}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Dana Kaget / Bonus Sekali */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Alokasi Bonus / THR (Satu Kali)
                </label>
                <span className="text-xs font-bold text-[#144D3A] bg-[#E8F2EC] px-2 py-0.5 rounded-full">
                  +{formatRupiah(oneTimeBoost)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1000000, 2500000, 5000000, 10000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOneTimeBoost(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      oneTimeBoost === val
                        ? 'bg-[#144D3A] border-[#144D3A] text-white shadow-sm'
                        : 'bg-[#F9FAF7] border-[#E5E7EB] text-[#1F2937] hover:bg-[#E8F2EC]'
                    }`}
                  >
                    {val === 0 ? 'Rp 0' : `+${formatRupiah(val)}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Outcome Card */}
          {simulation && (
            <div className="p-5 rounded-3xl bg-[#E8F2EC] border border-[#E8F2EC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#144D3A]/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2937]">Hasil Simulasi Realistis</h4>
                    <p className="text-[11px] text-[#6B7280]">Kalkulasi matematis deterministik</p>
                  </div>
                </div>
                {simulation.monthsSaved > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#144D3A] text-white shadow-sm">
                    Hemat {simulation.monthsSaved} Bulan!
                  </span>
                )}
              </div>

              {/* Progress comparison */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] text-[#6B7280] font-medium">Kondisi Normal</p>
                  <p className="text-base font-bold text-[#1F2937] mt-0.5">
                    {simulation.baseMonthsNeeded} bln
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    Est: {simulation.baseEstimatedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#144D3A]/30">
                  <p className="text-[11px] text-[#144D3A] font-semibold">Dengan Skenario Ini</p>
                  <p className="text-base font-bold text-[#144D3A] mt-0.5">
                    {simulation.simulatedMonthsNeeded} bln
                  </p>
                  <p className="text-[10px] text-[#144D3A] font-medium">
                    Est: {simulation.simulatedEstimatedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Narrative insight */}
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs text-[#1F2937] leading-relaxed">
                <span className="font-semibold text-[#144D3A]">Lega Insight: </span>
                {simulation.narrativeExplanation}
              </div>
            </div>
          )}

          {/* Calming reassurance */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F9FAF7] border border-[#E5E7EB] text-[#6B7280] text-[11px] leading-relaxed">
            <ShieldCheck size={16} className="text-[#144D3A] shrink-0 mt-0.5" />
            <span>
              Simulasi ini tidak mengikat dan dirancang tanpa tekanan. Anda selalu memegang kendali penuh atas ritme keuangan keluarga Anda.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#F9FAF7] border-t border-[#E5E7EB] flex flex-col sm:flex-row gap-2.5 justify-end">
          {onAskAiCompanion && (
            <button
              type="button"
              onClick={handleAskAI}
              className="px-4 py-2.5 rounded-2xl bg-[#E8F2EC] text-[#144D3A] font-semibold text-xs hover:bg-[#E8F2EC]/80 flex items-center justify-center gap-1.5 transition-colors border border-[#144D3A]/20"
            >
              <Sparkles size={14} className="text-[#144D3A]" />
              Tanya Strategi ke AI Companion
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#144D3A] text-white font-semibold text-xs hover:bg-[#2E7D61] transition-colors shadow-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
