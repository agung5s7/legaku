import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { ReceiptExtractionResult } from '../../types';
import { formatRupiah, parseRupiahInput, formatIndoDate } from '../../utils/formatters';
import { Check, CheckCircle2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptConfirmationModalProps {
  extraction: ReceiptExtractionResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
  extraction,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { categories, accounts, addTransaction } = useFinance();
  const { profile } = useAuth();

  const [merchantName, setMerchantName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [txDate, setTxDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial values when extraction changes
  React.useEffect(() => {
    if (extraction) {
      setMerchantName(extraction.merchant_name);
      setAmountInput(formatRupiah(extraction.total_amount));
      setSelectedCategory(extraction.suggested_category_id || categories[0]?.id || '');
      setSelectedAccount(accounts[0]?.id || '');
      setTxDate(extraction.transaction_date || new Date().toISOString().split('T')[0]);
      setDescription(`Belanja di ${extraction.merchant_name}`);
      setNotes(extraction.items?.length ? `${extraction.items.length} barang terdeteksi` : '');
    }
  }, [extraction, categories, accounts]);

  if (!extraction) return null;

  const handleConfirmSave = async () => {
    const numAmount = parseRupiahInput(amountInput);
    if (numAmount <= 0) return;

    setIsSubmitting(true);
    const res = await addTransaction({
      family_id: '',
      account_id: selectedAccount,
      category_id: selectedCategory,
      type: 'expense',
      amount: numAmount,
      transaction_date: txDate,
      description: description.trim() || `Belanja di ${merchantName}`,
      notes: notes.trim() || undefined,
      source: 'receipt_ai',
      creator_name: profile?.full_name,
    });
    setIsSubmitting(false);

    if (!res.error) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#274B39', '#8FB09A', '#C49744'],
      });
      onSaved();
      onClose();
    }
  };

  const isHighConfidence = (extraction.confidence?.amount || 0) >= 0.9;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cek dulu sebelum disimpan"
      subtitle="Pastikan rincian struk sudah tepat. Anda bisa mengubah setiap kolom."
      fullHeightOnMobile
    >
      <div className="space-y-4 pt-1">
        {/* Receipt Image Thumbnail & Confidence Badge */}
        <div className="flex items-center justify-between bg-cream-50 border border-warm-border/80 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            {extraction.imageUrl && (
              <img
                src={extraction.imageUrl}
                alt="Thumbnail Struk"
                className="w-12 h-12 rounded-xl object-cover border border-warm-border"
              />
            )}
            <div>
              <p className="text-xs font-bold text-forest-950">{merchantName}</p>
              <p className="text-[11px] text-warm-muted">{formatIndoDate(txDate)}</p>
            </div>
          </div>

          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              isHighConfidence
                ? 'bg-sage-100 text-forest-800 border border-sage-200'
                : 'bg-earth-gold/15 text-[#8C6618] border border-earth-gold/30'
            }`}
          >
            {isHighConfidence ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                Sudah cukup yakin
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                Perlu dicek
              </>
            )}
          </span>
        </div>

        {/* Large Amount Banner */}
        <div className="bg-white border border-warm-border/80 rounded-3xl p-4 text-center shadow-soft">
          <span className="text-[11px] font-semibold text-warm-muted uppercase tracking-wider block">
            Total Transaksi
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => setAmountInput(formatRupiah(parseRupiahInput(e.target.value)))}
            className="w-full text-center text-3xl font-extrabold text-forest-950 bg-transparent outline-none mt-1"
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-3 bg-white border border-warm-border/60 rounded-3xl p-4 shadow-soft">
          <Input
            label="Nama Merchant / Toko"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
          />

          <Input
            label="Keterangan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-forest-900/80 tracking-wide uppercase">
              Kategori Pengeluaran
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-warm-border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-forest-600"
            >
              {categories
                .filter((c) => c.type === 'expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-forest-900/80 tracking-wide uppercase">
              Rekening / Sumber Dana
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-white border border-warm-border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-forest-600"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatRupiah(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <Input
            type="date"
            label="Tanggal Transaksi"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />
        </div>

        {/* Extracted Line Items Preview (if any) */}
        {extraction.items && extraction.items.length > 0 && (
          <div className="bg-cream-50/60 border border-warm-border/60 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-warm-muted font-semibold uppercase text-[10px] tracking-wider border-b border-warm-border/40 pb-1">
              <span>Barang Belanjaan ({extraction.items.length})</span>
              <span>Harga</span>
            </div>
            <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
              {extraction.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-warm-dark py-0.5">
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="font-medium shrink-0">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-2 space-y-2">
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleConfirmSave}
            className="w-full h-12 text-sm font-semibold rounded-2xl shadow-soft"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Simpan Transaksi
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-10 text-xs"
          >
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  );
};
