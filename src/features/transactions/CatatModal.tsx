import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionType, ReceiptExtractionResult, TransactionTemplate } from '../../types';
import { formatRupiah, formatShortRupiah, parseRupiahInput, formatIndoDate } from '../../utils/formatters';
import { ReceiptScanner } from '../receipts/ReceiptScanner';
import { ReceiptConfirmationModal } from '../receipts/ReceiptConfirmationModal';
import { VoiceTransactionModal } from '../voice/VoiceTransactionModal';
import { TransferModal } from '../transfers/TransferModal';
import {
  Camera,
  Mic,
  Keyboard,
  Calendar,
  Plus,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CatatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'manual' | 'receipt' | 'voice' | 'transfer';
  prefilledTemplate?: TransactionTemplate | null;
}

export const CatatModal: React.FC<CatatModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'manual',
  prefilledTemplate = null,
}) => {
  const { categories, accounts, templates, addTransaction } = useFinance();
  const { profile } = useAuth();

  const [activeMode, setActiveMode] = useState<'manual' | 'receipt' | 'voice' | 'transfer'>(initialMode);
  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Receipt extraction state for confirmation modal
  const [extractedReceipt, setExtractedReceipt] = useState<ReceiptExtractionResult | null>(null);
  // Transfer modal state
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);

  // Default Catat Cepat chips from Design System
  const defaultQuickChips = [
    { name: 'Makan Siang', catKeyword: 'Makan', defaultAmt: 35000 },
    { name: 'Belanja Bulanan', catKeyword: 'Belanja', defaultAmt: 250000 },
    { name: 'Bensin Motor', catKeyword: 'Transport', defaultAmt: 30000 },
    { name: 'Token Listrik', catKeyword: 'Tagihan', defaultAmt: 100000 },
    { name: 'Paket Data & Wifi', catKeyword: 'Tagihan', defaultAmt: 75000 },
  ];

  // Sync mode if initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialMode === 'transfer') {
        setIsTransferOpen(true);
      } else {
        setActiveMode(initialMode);
      }
    }
  }, [isOpen, initialMode]);

  // Pre-fill template if provided
  React.useEffect(() => {
    if (prefilledTemplate) {
      setType(prefilledTemplate.type);
      if (prefilledTemplate.default_amount) {
        setAmountInput(formatRupiah(prefilledTemplate.default_amount));
      }
      if (prefilledTemplate.category_id) setSelectedCategory(prefilledTemplate.category_id);
      if (prefilledTemplate.account_id) setSelectedAccount(prefilledTemplate.account_id);
      if (prefilledTemplate.description) setDescription(prefilledTemplate.description);
      else setDescription(prefilledTemplate.name);
    }
  }, [prefilledTemplate]);

  // Filter categories by selected type (income/expense)
  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category and account on first open if empty
  React.useEffect(() => {
    if (isOpen) {
      if (!selectedCategory && filteredCategories.length > 0) {
        setSelectedCategory(filteredCategories[0].id);
      }
      if (!selectedAccount && accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    }
  }, [isOpen, filteredCategories, accounts, selectedCategory, selectedAccount]);

  const handleSelectTemplate = (tpl: TransactionTemplate) => {
    setType(tpl.type);
    if (tpl.default_amount) {
      setAmountInput(formatRupiah(tpl.default_amount));
    }
    if (tpl.category_id) setSelectedCategory(tpl.category_id);
    if (tpl.account_id) setSelectedAccount(tpl.account_id);
    setDescription(tpl.description || tpl.name);
  };

  const handleSelectQuickChip = (chip: typeof defaultQuickChips[0]) => {
    setType('expense');
    setDescription(chip.name);
    setAmountInput(formatRupiah(chip.defaultAmt));
    const matched = categories.find(
      (c) => c.type === 'expense' && c.name.toLowerCase().includes(chip.catKeyword.toLowerCase())
    );
    if (matched) setSelectedCategory(matched.id);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountInput('');
      return;
    }
    const val = parseInt(raw, 10);
    setAmountInput(formatRupiah(val));
  };

  const handleQuickAmount = (val: number) => {
    setAmountInput(formatRupiah(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseRupiahInput(amountInput);
    if (numericAmount <= 0) {
      setErrorMsg('Masukkan nominal transaksi yang valid.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Tulis keterangan singkat transaksi.');
      return;
    }
    if (!selectedAccount) {
      setErrorMsg('Pilih akun / rekening pembayaran.');
      return;
    }
    if (!selectedCategory) {
      setErrorMsg('Pilih kategori transaksi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addTransaction({
        family_id: '',
        account_id: selectedAccount,
        category_id: selectedCategory,
        type,
        amount: numericAmount,
        transaction_date: txDate,
        description: description.trim(),
        notes: notes.trim() || undefined,
        source: 'manual',
        creator_name: profile?.full_name,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      // Calm celebratory feedback
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#144D3A', '#2E7D61', '#4CAF8A', '#D6C6AC'],
      });

      // Reset form & close
      setAmountInput('');
      setDescription('');
      setNotes('');
      setShowNotes(false);
      setIsSubmitting(false);
      onClose();
    } catch {
      setErrorMsg('Transaksi belum tersimpan. Coba lagi.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !extractedReceipt && !isTransferOpen}
        onClose={onClose}
        title="Catat Keuangan"
        subtitle="Satu langkah kecil menuju keuangan keluarga yang lebih lega."
        fullHeightOnMobile
      >
        {/* Method Switcher Tabs (Compact) */}
        <div className="flex bg-[#E8F2EC] p-1 rounded-2xl text-xs font-semibold mb-3 font-sans">
          <button
            type="button"
            onClick={() => setActiveMode('receipt')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'receipt'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'text-[#144D3A] hover:bg-white/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="truncate">Foto Struk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('voice')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'voice'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'text-[#144D3A] hover:bg-white/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="truncate">Bicara</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-[#144D3A] text-white shadow-sm'
                : 'text-[#144D3A] hover:bg-white/50'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="truncate">Manual</span>
          </button>
        </div>

        {/* CATAT CEPAT CHIPS (Compact Single-Row) */}
        {activeMode === 'manual' && (
          <div className="mb-3 font-sans">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1 shrink-0 mr-0.5">
                <Sparkles className="w-3 h-3 text-[#2E7D61]" />
                Cepat:
              </span>
              {defaultQuickChips.map((chip) => (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => handleSelectQuickChip(chip)}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#144D3A] hover:bg-[#E8F2EC]/50 text-[#1F2937] text-[11px] font-medium shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  {chip.name}
                </button>
              ))}
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] hover:border-[#144D3A] hover:bg-[#E8F2EC]/50 text-[#1F2937] text-[11px] font-medium shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 1: KETIK MANUAL */}
        {activeMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-3 font-sans">
            {/* Income / Expense Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  const firstExp = categories.find((c) => c.type === 'expense');
                  if (firstExp) setSelectedCategory(firstExp.id);
                }}
                className={`py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all border cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#144D3A] text-white border-[#144D3A] shadow-xs'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAF7]'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  const firstInc = categories.find((c) => c.type === 'income');
                  if (firstInc) setSelectedCategory(firstInc.id);
                }}
                className={`py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all border cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#144D3A] text-white border-[#144D3A] shadow-xs'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAF7]'
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* Compact Amount Input Box */}
            <div className="bg-[#E8F2EC]/60 border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-center">
              <span className="text-[10px] font-medium text-[#6B7280] block uppercase tracking-wider">
                Nominal {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="Rp 0"
                autoFocus
                className="w-full text-center text-2xl sm:text-3xl font-extrabold text-[#144D3A] bg-transparent outline-none placeholder:text-[#9CA3AF] my-0.5"
              />
              {/* Quick Amount Chips in 1 scrollable row */}
              <div className="flex items-center justify-start sm:justify-center gap-1 overflow-x-auto no-scrollbar pt-1.5 border-t border-[#E5E7EB]/70">
                {[20000, 50000, 100000, 250000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[#144D3A] hover:bg-[#E8F2EC] shrink-0 transition-colors cursor-pointer font-medium"
                  >
                    +{formatShortRupiah(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column Grid: Kategori & Akun / Rekening */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1F2937] tracking-wide uppercase">
                  Kategori
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-1 focus:ring-[#144D3A] shadow-2xs truncate"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1F2937] tracking-wide uppercase">
                  Akun / Rekening
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-1 focus:ring-[#144D3A] shadow-2xs truncate"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatShortRupiah(acc.current_balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2-Column Grid: Tanggal & Keterangan */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1F2937] tracking-wide uppercase flex items-center justify-between">
                  <span>Tanggal</span>
                  <span className="text-[10px] text-[#6B7280] font-normal">{formatIndoDate(txDate)}</span>
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-1 focus:ring-[#144D3A] shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#1F2937] tracking-wide uppercase">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Makan Siang"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-1 focus:ring-[#144D3A] shadow-2xs"
                />
              </div>
            </div>

            {/* Optional Notes Toggle */}
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="text-[11px] font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-1 cursor-pointer pt-0.5"
              >
                <Plus className="w-3 h-3" />
                Tambah Catatan
              </button>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[#1F2937] tracking-wide uppercase">
                    Catatan Tambahan
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotes(false);
                      setNotes('');
                    }}
                    className="text-[10px] text-[#6B7280] hover:text-red-600 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Catatan belanja..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] outline-none focus:border-[#144D3A] shadow-2xs"
                />
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-[#EF4444] text-xs p-2.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1.5">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl shadow-subtle"
              >
                Simpan Transaksi
              </Button>
            </div>
          </form>
        )}

        {/* MODE 2: FOTO STRUK */}
        {activeMode === 'receipt' && (
          <ReceiptScanner
            onExtractionComplete={(result) => setExtractedReceipt(result)}
            onCancel={() => setActiveMode('manual')}
          />
        )}

        {/* MODE 3: BICARA */}
        {activeMode === 'voice' && (
          <VoiceTransactionModal
            onSaved={onClose}
            onSwitchToManual={() => setActiveMode('manual')}
          />
        )}
      </Modal>

      {/* RECEIPT CONFIRMATION MODAL */}
      <ReceiptConfirmationModal
        extraction={extractedReceipt}
        isOpen={Boolean(extractedReceipt)}
        onClose={() => setExtractedReceipt(null)}
        onSaved={() => {
          setExtractedReceipt(null);
          onClose();
        }}
      />

      {/* TRANSFER MODAL */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          onClose();
        }}
        onSuccess={() => {
          setIsTransferOpen(false);
          onClose();
        }}
      />
    </>
  );
};
