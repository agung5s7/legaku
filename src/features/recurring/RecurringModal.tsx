import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { RecurringFrequency, TransactionType } from '../../types';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { Calendar, Repeat, Tag, Wallet } from 'lucide-react';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({ isOpen, onClose }) => {
  const { categories, accounts, addRecurringTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextOccurrence, setNextOccurrence] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  React.useEffect(() => {
    if (isOpen) {
      if (!categoryId && filteredCategories.length > 0) setCategoryId(filteredCategories[0].id);
      if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
    }
  }, [isOpen, filteredCategories, accounts, categoryId, accountId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiahInput(raw);
    setAmountInput(parsed === 0 && raw === '' ? '' : formatRupiah(parsed));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseRupiahInput(amountInput);
    if (numericAmount <= 0) {
      setErrorMsg('Masukkan nominal yang valid');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Masukkan nama atau deskripsi pengeluaran rutin');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addRecurringTransaction({
        family_id: '',
        type,
        amount: numericAmount,
        description: description.trim(),
        category_id: categoryId || null,
        account_id: accountId || null,
        frequency,
        interval_value: 1,
        next_occurrence: nextOccurrence,
        end_date: null,
        is_active: true,
        auto_create: false,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setDescription('');
      setAmountInput('');
      setIsSubmitting(false);
      onClose();
    } catch {
      setErrorMsg('Gagal menyimpan transaksi berulang');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Transaksi Rutin"
      subtitle="LEGAKU akan mengingatkan Anda saat tagihan atau pemasukan ini tiba."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              const first = categories.find((c) => c.type === 'expense');
              if (first) setCategoryId(first.id);
            }}
            className={`py-2 rounded-2xl font-semibold text-xs transition-all border ${
              type === 'expense'
                ? 'bg-forest-800 text-white border-forest-800 shadow-soft'
                : 'bg-white text-warm-muted border-warm-border hover:bg-cream-50'
            }`}
          >
            Pengeluaran Rutin
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              const first = categories.find((c) => c.type === 'income');
              if (first) setCategoryId(first.id);
            }}
            className={`py-2 rounded-2xl font-semibold text-xs transition-all border ${
              type === 'income'
                ? 'bg-forest-800 text-white border-forest-800 shadow-soft'
                : 'bg-white text-warm-muted border-warm-border hover:bg-cream-50'
            }`}
          >
            Pemasukan Rutin
          </button>
        </div>

        {/* Description */}
        <Input
          label="Nama Transaksi Rutin"
          placeholder="Contoh: Wifi Rumah, Listrik PLN, SPP Anak, Gaji"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Amount Input */}
        <div className="bg-cream-50/70 border border-warm-border/80 rounded-3xl p-3.5 text-center">
          <span className="text-[11px] font-semibold text-warm-muted block uppercase tracking-wider mb-1">
            Nominal Per Pembayaran
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={handleAmountChange}
            placeholder="Rp 0"
            className="w-full text-center text-3xl font-extrabold text-forest-950 bg-transparent outline-none placeholder:text-warm-border"
          />
        </div>

        {/* Category Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-warm-muted uppercase tracking-wider">
            Pos Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-warm-border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-warm-dark outline-none focus:border-forest-600 shadow-soft"
          >
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Account Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-warm-muted uppercase tracking-wider">
            Akun Terkait
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-white border border-warm-border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-warm-dark outline-none focus:border-forest-600 shadow-soft"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency & Next Occurrence */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-warm-muted uppercase tracking-wider">
              Frekuensi
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full bg-white border border-warm-border rounded-2xl px-3 py-2 text-xs text-warm-dark outline-none focus:border-forest-600 shadow-soft"
            >
              <option value="weekly">Setiap Minggu</option>
              <option value="monthly">Setiap Bulan</option>
              <option value="yearly">Setiap Tahun</option>
            </select>
          </div>

          <Input
            type="date"
            label="Jatuh Tempo Berikutnya"
            value={nextOccurrence}
            onChange={(e) => setNextOccurrence(e.target.value)}
            prefixElement={<Calendar className="w-3.5 h-3.5" />}
          />
        </div>

        {errorMsg && (
          <div className="bg-earth-terracotta/10 border border-earth-terracotta/20 text-earth-rust text-xs p-3 rounded-2xl">
            {errorMsg}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full h-12 text-sm font-semibold rounded-2xl shadow-soft"
          >
            Simpan Jadwal Rutin
          </Button>
        </div>
      </form>
    </Modal>
  );
};
