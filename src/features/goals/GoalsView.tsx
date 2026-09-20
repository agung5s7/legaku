import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { formatRupiah, formatShortRupiah, parseRupiahInput, formatIndoDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Target,
  Plus,
  Calendar,
  ShieldCheck,
  Plane,
  GraduationCap,
  Home,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoalAmount } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('active');

  // New Goal Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [initialAmountInput, setInitialAmountInput] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Top Up Modal State
  const [topUpGoal, setTopUpGoal] = useState<Goal | null>(null);
  const [topUpAmountInput, setTopUpAmountInput] = useState('');

  // Icon selector based on name
  const getGoalIcon = (name: string) => {
    const lower = name.toLowerCase();
    let IconComponent = Target;
    if (lower.includes('darurat') || lower.includes('dana')) {
      IconComponent = ShieldCheck;
    } else if (lower.includes('liburan') || lower.includes('jepang') || lower.includes('trip')) {
      IconComponent = Plane;
    } else if (lower.includes('anak') || lower.includes('sekolah') || lower.includes('pendidikan')) {
      IconComponent = GraduationCap;
    } else if (lower.includes('rumah') || lower.includes('renovasi') || lower.includes('dp')) {
      IconComponent = Home;
    }

    return (
      <div className="w-11 h-11 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shrink-0">
        <IconComponent className="w-5 h-5 text-[#144D3A]" />
      </div>
    );
  };

  const filteredGoals = goals.filter((g) => {
    const isDone = g.target_amount > 0 && g.current_amount >= g.target_amount;
    if (activeTab === 'active') return !isDone;
    if (activeTab === 'completed') return isDone;
    return true;
  });

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetNum = parseRupiahInput(targetAmountInput);
    const initialNum = parseRupiahInput(initialAmountInput);

    if (!goalName.trim()) {
      setErrorMsg('Nama impian / target tidak boleh kosong.');
      return;
    }
    if (targetNum <= 0) {
      setErrorMsg('Tentukan target nominal tabungan.');
      return;
    }

    setIsSubmitting(true);
    const res = await addGoal({
      family_id: '',
      name: goalName.trim(),
      target_amount: targetNum,
      current_amount: initialNum,
      target_date: targetDate || null,
      description: description.trim() || null,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      confetti({
        particleCount: 25,
        spread: 50,
        colors: ['#144D3A', '#2E7D61', '#D6C6AC'],
      });
      setIsAddOpen(false);
      setGoalName('');
      setTargetAmountInput('');
      setInitialAmountInput('');
      setTargetDate('');
      setDescription('');
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpGoal) return;

    const addNum = parseRupiahInput(topUpAmountInput);
    if (addNum <= 0) return;

    setIsSubmitting(true);
    await updateGoalAmount(topUpGoal.id, addNum);
    setIsSubmitting(false);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#144D3A', '#2E7D61', '#D6C6AC'],
    });

    setTopUpGoal(null);
    setTopUpAmountInput('');
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header Matching Reference Design */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937]">Tujuan Keuangan</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Mewujudkan masa depan yang tenang bersama pasangan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#144D3A] hover:bg-[#2E7D61] text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
          aria-label="Tambah Target"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Filter Tabs (Semua, Aktif, Selesai) */}
      <div className="flex bg-[#E8F2EC] p-1 rounded-2xl text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 font-semibold rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-[#144D3A] text-white shadow-sm'
              : 'text-[#144D3A] hover:bg-white/60'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 font-semibold rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-[#144D3A] text-white shadow-sm'
              : 'text-[#144D3A] hover:bg-white/60'
          }`}
        >
          Aktif
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 font-semibold rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-[#144D3A] text-white shadow-sm'
              : 'text-[#144D3A] hover:bg-white/60'
          }`}
        >
          Selesai
        </button>
      </div>

      {/* Goals Cards List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-[#144D3A]" />
          </div>
          <h3 className="text-sm font-bold text-[#1F2937]">Belum Ada Target di Kategori Ini</h3>
          <p className="text-xs text-[#6B7280] max-w-xs mx-auto mt-1 mb-4">
            Mulai dari hal mendasar seperti Dana Darurat atau rencana liburan bersama keluarga.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            Buat Target Pertama
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredGoals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const isCompleted = progress >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {getGoalIcon(goal.name)}
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-[#1F2937] truncate">
                        {goal.name}
                      </h3>
                      <p className="text-sm font-extrabold text-[#144D3A] mt-0.5">
                        {formatRupiah(goal.target_amount)}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        {formatRupiah(goal.current_amount)} terkumpul
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      isCompleted ? 'bg-[#22C55E]/15 text-[#22C55E]' : 'bg-[#E8F2EC] text-[#144D3A]'
                    }`}
                  >
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#E8F2EC] h-2.5 rounded-full overflow-hidden mt-4">
                  <div
                    className="bg-[#144D3A] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Action & Date */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E5E7EB] text-xs">
                  <span className="text-[#6B7280] text-[11px]">
                    {goal.target_date ? `Target: ${formatIndoDate(goal.target_date)}` : 'Berkelanjutan'}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTopUpGoal(goal);
                      setTopUpAmountInput('');
                    }}
                    className="text-xs py-1 px-3"
                  >
                    + Tambah Tabungan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Buat Target Impian Baru"
        subtitle="Rencanakan tujuan keuangan keluarga dengan jelas dan bertahap."
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Nama Target Impian"
            placeholder="Contoh: Dana Darurat, Liburan ke Jepang, DP Rumah"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            autoFocus
          />

          <Input
            label="Target Nominal (Rp)"
            placeholder="Rp 0"
            value={targetAmountInput}
            onChange={(e) => setTargetAmountInput(formatRupiah(parseRupiahInput(e.target.value)))}
          />

          <Input
            label="Dana Awal yang Sudah Ada (Opsional)"
            placeholder="Rp 0"
            value={initialAmountInput}
            onChange={(e) => setInitialAmountInput(formatRupiah(parseRupiahInput(e.target.value)))}
          />

          <Input
            type="date"
            label="Target Waktu Tercapai (Opsional)"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <Input
            label="Catatan / Rencana Pendukung"
            placeholder="Misal: Nabung Rp 1 juta tiap tanggal gajian"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {errorMsg && <p className="text-xs text-earth-rust">{errorMsg}</p>}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full h-12"
            >
              Simpan Target Impian
            </Button>
          </div>
        </form>
      </Modal>

      {/* TOP UP GOAL MODAL */}
      <Modal
        isOpen={Boolean(topUpGoal)}
        onClose={() => setTopUpGoal(null)}
        title={`Tambah Dana ke ${topUpGoal?.name}`}
        subtitle="Setiap setoran kecil membawa keluarga semakin dekat ke tujuan."
      >
        <form onSubmit={handleTopUpSubmit} className="space-y-4">
          <div className="bg-[#E8F2EC] border border-[#E8F2EC] rounded-2xl p-4 text-center">
            <span className="text-xs text-[#6B7280] block">Nominal yang akan ditambahkan</span>
            <input
              type="text"
              inputMode="numeric"
              value={topUpAmountInput}
              onChange={(e) => setTopUpAmountInput(formatRupiah(parseRupiahInput(e.target.value)))}
              placeholder="Rp 0"
              autoFocus
              className="w-full text-center text-3xl font-bold text-[#144D3A] bg-transparent outline-none mt-1 placeholder:text-[#9CA3AF]"
            />
          </div>

          <div className="flex justify-center gap-2">
            {[100000, 250000, 500000, 1000000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTopUpAmountInput(formatRupiah(v))}
                className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#144D3A] hover:bg-[#E8F2EC] font-medium"
              >
                +{formatShortRupiah(v)}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full h-12"
            >
              Konfirmasi Tabungan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
