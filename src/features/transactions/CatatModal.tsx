import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionType, ReceiptExtractionResult, TransactionTemplate } from '../../types';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
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
        {/* Three Primary Method Cards (Foto Struk, Bicara, Ketik Manual) */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 font-sans">
          <button
            type="button"
            onClick={() => setActiveMode('receipt')}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeMode === 'receipt'
                ? 'border-[#144D3A] bg-[#E8F2EC]/80 shadow-subtle ring-1 ring-[#144D3A]'
                : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAF7]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#1F2937]">Foto Struk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('voice')}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeMode === 'voice'
                ? 'border-[#144D3A] bg-[#E8F2EC]/80 shadow-subtle ring-1 ring-[#144D3A]'
                : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAF7]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#1F2937]">Bicara</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              activeMode === 'manual'
                ? 'border-[#144D3A] bg-[#E8F2EC]/80 shadow-subtle ring-1 ring-[#144D3A]'
                : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAF7]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#1F2937]">Ketik Manual</span>
          </button>
        </div>

        {/* CATAT CEPAT CHIPS (Requirement #11) */}
        {activeMode === 'manual' && (
          <div className="mb-4 font-sans">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#2E7D61]" />
                Catat Cepat
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {defaultQuickChips.map((chip) => (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => handleSelectQuickChip(chip)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#144D3A] hover:bg-[#E8F2EC]/50 text-[#1F2937] text-xs font-medium shrink-0 shadow-subtle transition-all active:scale-95 cursor-pointer"
                >
                  {chip.name}
                </button>
              ))}
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#144D3A] hover:bg-[#E8F2EC]/50 text-[#1F2937] text-xs font-medium shrink-0 shadow-subtle transition-all active:scale-95 cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 1: KETIK MANUAL */}
        {activeMode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {/* Income / Expense Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  const firstExp = categories.find((c) => c.type === 'expense');
                  if (firstExp) setSelectedCategory(firstExp.id);
                }}
                className={`py-2.5 rounded-2xl font-semibold text-sm transition-all border cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#144D3A] text-white border-[#144D3A] shadow-subtle'
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
                className={`py-2.5 rounded-2xl font-semibold text-sm transition-all border cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#144D3A] text-white border-[#144D3A] shadow-subtle'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAF7]'
                }`}
              >
                Pemasukan
              </button>
            </div>

            {/* Amount Input with Large Display */}
            <div className="bg-[#E8F2EC]/60 border border-[#E5E7EB] rounded-3xl p-4 text-center">
              <span className="text-xs font-medium text-[#6B7280] block uppercase tracking-wider mb-1">
                Nominal {type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="Rp 0"
                autoFocus
                className="w-full text-center text-3xl sm:text-4xl font-bold text-[#144D3A] bg-transparent outline-none placeholder:text-[#9CA3AF]"
              />
              {/* Quick Amount Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-2.5 border-t border-[#E5E7EB]">
                {[20000, 50000, 100000, 250000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#144D3A] hover:bg-[#E8F2EC] transition-colors cursor-pointer font-medium"
                  >
                    +{formatRupiah(val)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2937] tracking-wide uppercase">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/10 shadow-subtle"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2937] tracking-wide uppercase">
                Akun / Rekening
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/10 shadow-subtle"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatRupiah(acc.current_balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <Input
              type="date"
              label="Tanggal"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              prefixElement={<Calendar className="w-4 h-4 text-[#6B7280]" />}
            />

            {/* Description Input */}
            <Input
              label="Deskripsi"
              placeholder="Contoh: Makan siang di kantor, Belanja galon"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Optional Notes Toggle */}
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Catatan
              </button>
            ) : (
              <Input
                label="Catatan Tambahan"
                placeholder="Catatan belanja..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-[#EF4444] text-xs p-3 rounded-2xl">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full h-12 text-sm font-semibold rounded-2xl shadow-subtle"
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
