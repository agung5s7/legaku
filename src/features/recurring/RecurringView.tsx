import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { RecurringTransaction } from '../../types';
import { formatRupiah, formatDateIndonesian } from '../../utils/formatters';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { Button } from '../../components/ui/Button';
import { RecurringModal } from './RecurringModal';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface RecurringViewProps {
  onRecordNow?: (recurring: RecurringTransaction) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({ onRecordNow }) => {
  const { recurringTransactions, toggleRecurringActive, deleteRecurringTransaction } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly':
        return 'Setiap minggu';
      case 'monthly':
        return 'Setiap bulan';
      case 'yearly':
        return 'Setiap tahun';
      default:
        return 'Berkala';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header card with Action */}
      <div className="bg-white border border-warm-border/60 rounded-3xl p-5 shadow-soft flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-forest-950 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-forest-800" />
            Transaksi Berulang
          </h2>
          <p className="text-xs text-warm-muted mt-0.5">
            Daftar tagihan rutin dan pemasukan berkala keluarga.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl text-xs gap-1 shadow-soft"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Rutin
        </Button>
      </div>

      {/* List of Recurring Transactions */}
      {recurringTransactions.length === 0 ? (
        <div className="bg-white border border-warm-border/60 rounded-3xl p-8 text-center shadow-soft">
          <Repeat className="w-10 h-10 text-warm-muted/40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-forest-950">Belum Ada Transaksi Rutin</h3>
          <p className="text-xs text-warm-muted mt-1 max-w-xs mx-auto">
            Tambahkan tagihan bulanan seperti listrik, wifi, atau cicilan agar LEGAKU dapat mengingatkan Anda secara tenang.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-xs"
          >
            Mulai Jadwalkan Tagihan
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((rec) => {
            const isExp = rec.type === 'expense';
            return (
              <div
                key={rec.id}
                className={`bg-white border border-warm-border/60 rounded-3xl p-4 shadow-soft transition-all ${
                  !rec.is_active ? 'opacity-60 bg-cream-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isExp ? 'bg-cream-100 text-forest-800' : 'bg-sage-100 text-forest-800'
                      }`}
                    >
                      <CategoryIcon name={rec.category_icon || 'Receipt'} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-forest-950 truncate">
                          {rec.description}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            rec.is_active
                              ? 'bg-sage-100 text-forest-800'
                              : 'bg-warm-border/40 text-warm-muted'
                          }`}
                        >
                          {rec.is_active ? 'Aktif' : 'Dijeda'}
                        </span>
                      </div>

                      <p className="text-xs text-warm-muted mt-0.5 flex items-center gap-1.5">
                        <span>{formatFrequencyLabel(rec.frequency)}</span>
                        {rec.account_name && (
                          <>
                            <span className="text-warm-border">•</span>
                            <span>{rec.account_name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Nominal */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isExp ? 'text-forest-950' : 'text-forest-700'
                      }`}
                    >
                      {formatRupiah(rec.amount)}
                    </span>
                  </div>
                </div>

                {/* Bottom detail row with Due Date and Controls */}
                <div className="mt-3 pt-3 border-t border-warm-border/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-warm-muted text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-forest-800" />
                    <span>Berikutnya:</span>
                    <span className="font-semibold text-warm-dark">
                      {formatDateIndonesian(rec.next_occurrence)}
                    </span>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {onRecordNow && rec.is_active && (
                      <button
                        type="button"
                        onClick={() => onRecordNow(rec)}
                        className="px-2.5 py-1 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-[11px] font-semibold transition-all"
                      >
                        Catat Sekarang
                      </button>
                    )}

                    {/* Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={() => toggleRecurringActive(rec.id, !rec.is_active)}
                      className="p-1.5 rounded-xl text-warm-muted hover:text-forest-900 hover:bg-cream-100 transition-colors"
                      title={rec.is_active ? 'Jeda transaksi rutin' : 'Lanjutkan jadwal'}
                    >
                      {rec.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => deleteRecurringTransaction(rec.id)}
                      className="p-1.5 rounded-xl text-warm-muted hover:text-earth-rust hover:bg-earth-terracotta/10 transition-colors"
                      title="Hapus transaksi rutin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recurring Modal */}
      <RecurringModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
