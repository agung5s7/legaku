import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatShortRupiah, parseRupiahInput } from '../../utils/formatters';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Plus, Edit3 } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const { budgets, categories, transactions, setCategoryBudget } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute spent amount per category for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spentByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      const d = new Date(tx.transaction_date);
      if (tx.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        map.set(tx.category_id, (map.get(tx.category_id) || 0) + Number(tx.amount));
      }
    }
    return map;
  }, [transactions, currentMonth, currentYear]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseRupiahInput(amountInput);
    if (!selectedCatId || num <= 0) return;

    setIsSubmitting(true);
    await setCategoryBudget(selectedCatId, num);
    setIsSubmitting(false);

    setIsModalOpen(false);
    setSelectedCatId('');
    setAmountInput('');
  };

  const openSetBudget = (categoryId?: string, currentAmount?: number) => {
    setSelectedCatId(categoryId || (expenseCategories[0]?.id || ''));
    setAmountInput(currentAmount ? formatRupiah(currentAmount) : '');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937]">Anggaran Bulanan</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Menjaga pengeluaran tetap proporsional tanpa rasa bersalah.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => openSetBudget()}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Atur Anggaran
        </Button>
      </div>

      {/* Budget Cards List */}
      {budgets.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#1F2937]">Belum ada anggaran yang diatur</p>
          <p className="text-xs text-[#6B7280] mt-1 mb-4">
            Atur anggaran per kategori untuk memantau pengeluaran keluarga lebih tenang.
          </p>
          <Button variant="primary" size="sm" onClick={() => openSetBudget()}>
            Mulai Buat Anggaran
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((bgt) => {
            const spent = spentByCategory.get(bgt.category_id) || 0;
            const remaining = bgt.amount - spent;
            const percentage = Math.min(100, Math.round((spent / bgt.amount) * 100));
            const isOver = spent > bgt.amount;

            return (
              <div
                key={bgt.id}
                className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                      <CategoryIcon name={bgt.category_icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">{bgt.category_name}</h3>
                      <p className="text-[11px] text-[#6B7280]">Anggaran: {formatRupiah(bgt.amount)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openSetBudget(bgt.category_id, bgt.amount)}
                    className="p-2 rounded-xl hover:bg-[#E8F2EC] text-[#6B7280] hover:text-[#144D3A] transition-colors"
                    title="Ubah Anggaran"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-[#E8F2EC] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-[#EF4444]'
                          : percentage > 80
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#144D3A]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Terpakai: {formatRupiah(spent)}</span>
                    <span
                      className={`font-semibold ${
                        isOver ? 'text-[#EF4444]' : 'text-[#144D3A]'
                      }`}
                    >
                      {isOver ? `Melebihi ${formatRupiah(Math.abs(remaining))}` : `Sisa ${formatRupiah(remaining)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SET BUDGET MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Atur Anggaran Kategori"
        subtitle="Tetapkan batas wajar untuk kategori pengeluaran keluarga."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1F2937] tracking-wide">
              Pilih Kategori Pengeluaran
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/20"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Batas Anggaran Bulanan (Rp)"
            placeholder="Rp 0"
            value={amountInput}
            onChange={(e) => setAmountInput(formatRupiah(parseRupiahInput(e.target.value)))}
            autoFocus
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full h-12"
            >
              Simpan Anggaran
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
