import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { formatRupiah, parseRupiahInput, formatIndoDate } from '../../utils/formatters';
import { Trash2, Edit2, Calendar, Wallet, User, Tag, Sparkles, AlertCircle, ChevronDown, Receipt } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { updateTransaction, deleteTransaction, accounts, categories } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showItemsList, setShowItemsList] = useState(false);

  // Edit fields
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editDate, setEditDate] = useState('');

  // Reset when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setEditAmount(formatRupiah(transaction.amount));
      setEditDescription(transaction.description);
      setEditCategory(transaction.category_id);
      setEditAccount(transaction.account_id);
      setEditDate(transaction.transaction_date);
      setIsEditing(false);
      setIsConfirmingDelete(false);
      setShowItemsList(false);
      setErrorMsg('');
    }
  }, [transaction]);

  if (!transaction) return null;

  const isExpense = transaction.type === 'expense';

  const handleSaveEdit = async () => {
    const num = parseRupiahInput(editAmount);
    if (num <= 0) {
      setErrorMsg('Nominal harus lebih dari 0.');
      return;
    }
    if (!editDescription.trim()) {
      setErrorMsg('Keterangan tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    const res = await updateTransaction(transaction.id, {
      amount: num,
      description: editDescription.trim(),
      category_id: editCategory,
      account_id: editAccount,
      transaction_date: editDate,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsEditing(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const res = await deleteTransaction(transaction.id);
    setIsSubmitting(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ubah Transaksi' : 'Rincian Transaksi'}
      subtitle={isEditing ? 'Sesuaikan data transaksi keluarga' : 'Detail pencatatan keuangan'}
    >
      {isConfirmingDelete ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-earth-terracotta/15 flex items-center justify-center text-earth-rust mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-forest-950">Hapus Transaksi Ini?</h3>
            <p className="text-xs text-warm-muted max-w-xs mx-auto mt-1 leading-relaxed">
              Saldo rekening Anda akan disesuaikan kembali secara otomatis. Aksi ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleDelete}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <Input
            label="Nominal Transaksi"
            value={editAmount}
            onChange={(e) => setEditAmount(formatRupiah(parseRupiahInput(e.target.value)))}
          />
          <Input
            label="Keterangan"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-forest-900/80 tracking-wide uppercase">
              Kategori
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full bg-white border border-warm-border rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-forest-600"
            >
              {categories
                .filter((c) => c.type === transaction.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-forest-900/80 tracking-wide uppercase">
              Rekening / Akun
            </label>
            <select
              value={editAccount}
              onChange={(e) => setEditAccount(e.target.value)}
              className="w-full bg-white border border-warm-border rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-forest-600"
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
            label="Tanggal"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />

          {errorMsg && <p className="text-xs text-earth-rust">{errorMsg}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleSaveEdit}
              className="flex-1"
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Amount Badge Banner */}
          <div className="bg-cream-50 border border-warm-border/80 rounded-3xl p-5 text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                isExpense ? 'bg-earth-terracotta/10 text-earth-rust' : 'bg-sage-100 text-forest-800'
              }`}
            >
              {isExpense ? 'Pengeluaran' : 'Pemasukan'}
            </span>
            <div
              className={`text-3xl font-bold ${
                isExpense ? 'text-forest-950' : 'text-forest-700'
              }`}
            >
              {isExpense ? '-' : '+'}
              {formatRupiah(transaction.amount)}
            </div>
            <p className="text-sm font-semibold text-warm-dark mt-1">{transaction.description}</p>
            {transaction.notes && (() => {
              const lines = transaction.notes.split('\n').map((l) => l.trim()).filter(Boolean);
              const mainTitle = lines[0] || '';
              const subItems = lines.slice(1);
              const isDetectedBadge = mainTitle.toLowerCase().includes('barang terdeteksi') || subItems.length > 0;

              if (isDetectedBadge) {
                return (
                  <div className="mt-2.5 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setShowItemsList(!showItemsList)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sage-100/70 hover:bg-sage-100 text-forest-900 border border-sage-200/80 transition-all shadow-soft cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-forest-700" />
                      <span>{mainTitle}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-forest-700 transition-transform duration-200 ${
                          showItemsList ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showItemsList && (
                      <div className="w-full mt-2.5 bg-white border border-warm-border/80 rounded-2xl p-3.5 text-left space-y-1.5 shadow-soft max-h-52 overflow-y-auto">
                        <div className="text-[10px] font-bold text-warm-muted uppercase tracking-wider border-b border-warm-border/40 pb-1 flex items-center justify-between">
                          <span>Rincian Barang Belanjaan</span>
                          {subItems.length > 0 && <span className="font-semibold text-forest-800">{subItems.length} item</span>}
                        </div>
                        {subItems.length > 0 ? (
                          subItems.map((item, idx) => {
                            const cleanItem = item.replace(/^[•\-\*]\s*/, '');
                            const parts = cleanItem.split(' - ');
                            const itemName = parts[0];
                            const itemPrice = parts.slice(1).join(' - ');
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs text-warm-dark py-0.5 border-b border-warm-border/20 last:border-none">
                                <span className="truncate pr-2 font-medium">{itemName}</span>
                                {itemPrice && <span className="font-semibold text-forest-900 shrink-0">{itemPrice}</span>}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-warm-muted py-1 text-center">Rincian nama item tersimpan pada struk.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return <p className="text-xs text-warm-muted italic mt-1">"{transaction.notes}"</p>;
            })()}
          </div>

          {/* Details Table */}
          <div className="space-y-3 bg-white border border-warm-border/60 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-warm-border/40">
              <span className="text-warm-muted flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-forest-700" /> Kategori
              </span>
              <span className="font-semibold text-warm-dark flex items-center gap-1">
                <CategoryIcon name={transaction.category_icon} className="w-3.5 h-3.5 text-forest-700" />
                {transaction.category_name}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-warm-border/40">
              <span className="text-warm-muted flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-forest-700" /> Sumber Dana
              </span>
              <span className="font-semibold text-warm-dark">{transaction.account_name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-warm-border/40">
              <span className="text-warm-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-forest-700" /> Tanggal
              </span>
              <span className="font-semibold text-warm-dark">{formatIndoDate(transaction.transaction_date)}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-warm-border/40">
              <span className="text-warm-muted flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-forest-700" /> Dicatat Oleh
              </span>
              <span className="font-semibold text-forest-800">{transaction.creator_name || 'Anggota Keluarga'}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-warm-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-earth-gold" /> Metode
              </span>
              <span className="font-medium capitalize text-warm-muted">{transaction.source}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="gap-1.5"
            >
              <Edit2 className="w-4 h-4 text-forest-700" />
              Ubah
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsConfirmingDelete(true)}
              className="gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-earth-rust" />
              Hapus
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
