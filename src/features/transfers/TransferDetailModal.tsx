import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Transfer } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatDateIndonesian } from '../../utils/formatters';
import { ArrowRight, ArrowRightLeft, Trash2, Calendar, User, FileText } from 'lucide-react';

interface TransferDetailModalProps {
  transfer: Transfer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  transfer,
  isOpen,
  onClose,
}) => {
  const { deleteTransfer } = useFinance();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!transfer) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const res = await deleteTransfer(transfer.id);
      if (res.error) {
        setErrorMsg(res.error);
        setIsDeleting(false);
        return;
      }
      setIsDeleting(false);
      setShowConfirmDelete(false);
      onClose();
    } catch {
      setErrorMsg('Gagal membatalkan transfer');
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Transfer Saldo"
      subtitle="Perpindahan dana internal antar rekening keluarga."
    >
      <div className="space-y-4">
        {/* Visual Amount & Account Flow Card */}
        <div className="bg-cream-50/90 border border-warm-border/70 rounded-3xl p-5 text-center space-y-3">
          <span className="text-[11px] font-semibold text-warm-muted uppercase tracking-wider block">
            Nominal Dipindahkan
          </span>
          <div className="text-3xl font-extrabold text-forest-950">
            {formatRupiah(transfer.amount)}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 text-xs font-semibold text-forest-900">
            <span className="bg-white px-3 py-1.5 rounded-xl border border-warm-border shadow-sm">
              {transfer.from_account_name || 'Rekening Asal'}
            </span>
            <ArrowRight className="w-4 h-4 text-warm-muted" />
            <span className="bg-white px-3 py-1.5 rounded-xl border border-warm-border shadow-sm">
              {transfer.to_account_name || 'Rekening Tujuan'}
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="bg-white border border-warm-border/70 rounded-2xl p-4 space-y-3 divide-y divide-warm-border/30 text-xs">
          <div className="flex items-center justify-between pt-1 first:pt-0">
            <span className="text-warm-muted flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Tanggal
            </span>
            <span className="font-semibold text-warm-dark">
              {formatDateIndonesian(transfer.transfer_date)}
            </span>
          </div>

          {transfer.description && (
            <div className="flex items-start justify-between pt-3">
              <span className="text-warm-muted flex items-center gap-2 shrink-0">
                <FileText className="w-3.5 h-3.5" /> Keterangan
              </span>
              <span className="font-medium text-warm-dark text-right ml-4">
                {transfer.description}
              </span>
            </div>
          )}

          {transfer.creator_name && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-warm-muted flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Dicatat oleh
              </span>
              <span className="font-semibold text-warm-dark">{transfer.creator_name}</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-earth-terracotta/10 border border-earth-terracotta/20 text-earth-rust text-xs p-3 rounded-2xl">
            {errorMsg}
          </div>
        )}

        {/* Delete Confirmation or Actions */}
        {!showConfirmDelete ? (
          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDelete(true)}
              className="flex-1 text-earth-rust hover:bg-earth-terracotta/10 border-earth-terracotta/30 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Hapus / Batalkan Transfer
            </Button>
            <Button type="button" variant="primary" onClick={onClose} className="flex-1 text-xs">
              Tutup
            </Button>
          </div>
        ) : (
          <div className="bg-earth-terracotta/10 border border-earth-terracotta/30 p-4 rounded-3xl space-y-3">
            <p className="text-xs text-earth-rust font-semibold text-center">
              Apakah Anda yakin ingin menghapus transfer ini? Saldo rekening asal dan tujuan akan dikembalikan seperti semula.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isDeleting}
                onClick={handleDelete}
                className="flex-1 bg-earth-terracotta hover:bg-earth-rust text-white text-xs"
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
