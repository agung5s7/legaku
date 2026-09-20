import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { ArrowRight, ArrowRightLeft, Calendar, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { accounts, addTransfer } = useFinance();

  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto initialize different source and destination accounts
  React.useEffect(() => {
    if (isOpen && accounts.length >= 2) {
      if (!fromAccountId) setFromAccountId(accounts[0].id);
      if (!toAccountId) setToAccountId(accounts[1].id);
    }
  }, [isOpen, accounts, fromAccountId, toAccountId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiahInput(raw);
    if (parsed === 0 && raw === '') {
      setAmountInput('');
    } else {
      setAmountInput(formatRupiah(parsed));
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmountInput(formatRupiah(val));
  };

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseRupiahInput(amountInput);
    if (numericAmount <= 0) {
      setErrorMsg('Masukkan nominal transfer yang valid.');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      setErrorMsg('Pilih rekening asal dan tujuan transfer.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMsg('Rekening asal dan tujuan tidak boleh sama.');
      return;
    }
    if (fromAcc && fromAcc.current_balance < numericAmount) {
      // Soft non-blocking warning or gentle reminder
      // We allow transfer but could warn if negative balance
    }

    setIsSubmitting(true);
    try {
      const res = await addTransfer({
        family_id: '',
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: numericAmount,
        transfer_date: transferDate,
        description: description.trim() || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      // Calm mini celebratory effect
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#467B60', '#8FB09A', '#C49744'],
      });

      setAmountInput('');
      setDescription('');
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setErrorMsg('Gagal memproses transfer. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pindah Dana Antar Rekening"
      subtitle="Memindahkan saldo tanpa mengubah total kekayaan keluarga."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source and Destination Accounts Visual Card */}
        <div className="bg-[#E8F2EC] rounded-3xl p-4 space-y-3">
          {/* Dari */}
          <div>
            <label className="block text-[11px] font-semibold text-[#144D3A] uppercase tracking-wider mb-1">
              Dari Rekening
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/20 shadow-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatRupiah(acc.current_balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Transfer arrow indicator */}
          <div className="flex items-center justify-center -my-1">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center text-[#144D3A]">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Ke */}
          <div>
            <label className="block text-[11px] font-semibold text-[#144D3A] uppercase tracking-wider mb-1">
              Ke Rekening Tujuan
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/20 shadow-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatRupiah(acc.current_balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 text-center shadow-sm">
          <span className="text-[11px] font-semibold text-[#6B7280] block uppercase tracking-wider mb-1">
            Nominal Transfer
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={handleAmountChange}
            placeholder="Rp 0"
            autoFocus
            className="w-full text-center text-3xl sm:text-4xl font-extrabold text-[#144D3A] bg-transparent outline-none placeholder:text-[#9CA3AF]"
          />
          {/* Quick Amount Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-2 border-t border-[#E5E7EB]">
            {[50000, 100000, 250000, 500000, 1000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className="text-xs px-2.5 py-1 rounded-full bg-[#F9FAF7] border border-[#E5E7EB] text-[#144D3A] hover:bg-[#E8F2EC] font-medium transition-colors"
              >
                +{formatRupiah(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Picker */}
        <Input
          type="date"
          label="Tanggal Transfer"
          value={transferDate}
          onChange={(e) => setTransferDate(e.target.value)}
          prefixElement={<Calendar className="w-4 h-4 text-[#144D3A]" />}
        />

        {/* Notes / Description */}
        <Input
          label="Keterangan (Opsional)"
          placeholder="Contoh: Top-up e-wallet mingguan, Tarik tunai"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          prefixElement={<FileText className="w-4 h-4 text-[#144D3A]" />}
        />

        {errorMsg && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs p-3 rounded-2xl">
            {errorMsg}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full h-12 text-sm font-semibold rounded-2xl shadow-sm"
          >
            Pindahkan Saldo
          </Button>
        </div>
      </form>
    </Modal>
  );
};
