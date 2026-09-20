import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { TransactionTemplate, TransactionType } from '../../types';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { Bookmark, Plus, Trash2, Tag } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: TransactionTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { templates, categories, accounts, addTemplate, deleteTemplate } = useFinance();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  React.useEffect(() => {
    if (isCreating) {
      if (!categoryId && filteredCategories.length > 0) setCategoryId(filteredCategories[0].id);
      if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
    }
  }, [isCreating, filteredCategories, accounts, categoryId, accountId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiahInput(raw);
    setAmountInput(parsed === 0 && raw === '' ? '' : formatRupiah(parsed));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Tulis nama template transaksi');
      return;
    }

    const numericAmount = amountInput ? parseRupiahInput(amountInput) : null;

    setIsSubmitting(true);
    try {
      const res = await addTemplate({
        family_id: '',
        name: name.trim(),
        type,
        default_amount: numericAmount && numericAmount > 0 ? numericAmount : null,
        category_id: categoryId || null,
        account_id: accountId || null,
        description: description.trim() || null,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setName('');
      setAmountInput('');
      setDescription('');
      setIsCreating(false);
      setIsSubmitting(false);
    } catch {
      setErrorMsg('Gagal membuat template');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Catat Cepat"
      subtitle="Pintasan transaksi yang sering Anda catat setiap hari."
    >
      <div className="space-y-4">
        {!isCreating ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warm-muted uppercase tracking-wider">
                Daftar Template ({templates.length})
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Template Baru
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {templates.length === 0 ? (
                <div className="p-6 text-center text-xs text-warm-muted bg-cream-50/50 rounded-2xl border border-warm-border/60">
                  Belum ada template. Buat template transaksi favorit Anda.
                </div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 bg-white border border-warm-border/70 rounded-2xl flex items-center justify-between shadow-soft hover:bg-sage-50/40 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => {
                        if (onSelectTemplate) {
                          onSelectTemplate(tpl);
                          onClose();
                        }
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-cream-100 text-forest-800 flex items-center justify-center shrink-0">
                        <CategoryIcon name={tpl.category_icon || 'Tag'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-forest-950 truncate">{tpl.name}</p>
                        <p className="text-[10px] text-warm-muted truncate">
                          {tpl.category_name || 'Umum'} • {tpl.default_amount ? formatRupiah(tpl.default_amount) : 'Nominal fleksibel'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-1.5 text-warm-muted hover:text-earth-rust transition-colors"
                      title="Hapus template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateTemplate} className="space-y-3.5">
            <Input
              label="Nama Template"
              placeholder="Contoh: 🍜 Bakso Sore, 🛒 Supermarket Mingguan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-semibold rounded-xl border ${
                  type === 'expense'
                    ? 'bg-forest-800 text-white border-forest-800'
                    : 'bg-white text-warm-muted border-warm-border'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-xl border ${
                  type === 'income'
                    ? 'bg-forest-800 text-white border-forest-800'
                    : 'bg-white text-warm-muted border-warm-border'
                }`}
              >
                Pemasukan
              </button>
            </div>

            <Input
              label="Nominal Biasa (Opsional)"
              placeholder="Rp 0"
              value={amountInput}
              onChange={handleAmountChange}
            />

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-warm-muted uppercase tracking-wider">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-warm-border rounded-xl px-3 py-2 text-xs text-warm-dark outline-none focus:border-forest-600 shadow-soft"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Keterangan Transaksi"
              placeholder="Catatan default..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {errorMsg && (
              <div className="bg-earth-terracotta/10 border border-earth-terracotta/20 text-earth-rust text-xs p-2.5 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="flex-1 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="flex-1 text-xs"
              >
                Simpan Template
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
