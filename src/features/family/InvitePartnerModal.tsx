import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useFamily } from '../../context/FamilyContext';
import { Copy, Check, MessageCircle, Heart, ShieldCheck } from 'lucide-react';

interface InvitePartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvitePartnerModal: React.FC<InvitePartnerModalProps> = ({ isOpen, onClose }) => {
  const { family, getInviteLink } = useFamily();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteCode = family?.invite_code || 'LEGAKU-AB12CD';
  const inviteLink = getInviteLink();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Halo, yuk kelola keuangan keluarga kita bareng di LEGAKU. Masukkan kode undangan: *${inviteCode}* atau klik tautan berikut: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Undang Pasangan"
      subtitle="Kelola dan rencanakan keuangan keluarga bersama lebih tenang."
    >
      <div className="space-y-6 pt-1">
        {/* Calm Intro Banner */}
        <div className="bg-[#E8F2EC] rounded-2xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#144D3A] shrink-0 mt-0.5 shadow-sm">
            <Heart className="w-5 h-5 text-[#144D3A] fill-[#E8F2EC]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#144D3A]">Transparansi Finansial Berdua</h4>
            <p className="text-xs text-[#1F2937]/80 mt-1 leading-relaxed">
              Saat pasangan bergabung, kalian berdua bisa mencatat transaksi, melihat update saldo bersama secara otomatis, dan memantau tabungan impian tanpa tekanan.
            </p>
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#1F2937] tracking-wide uppercase">
            Kode Undangan Keluarga
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F9FAF7] border-2 border-dashed border-[#144D3A]/30 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-[#144D3A] select-all">
              {inviteCode}
            </div>
            <Button
              type="button"
              variant={copiedCode ? 'secondary' : 'outline'}
              onClick={handleCopyCode}
              className="h-12 px-4 rounded-2xl"
            >
              {copiedCode ? <Check className="w-5 h-5 text-[#144D3A]" /> : <Copy className="w-5 h-5 text-[#6B7280]" />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleWhatsAppShare}
            className="w-full h-12 bg-[#25D366] hover:bg-[#1EBE5D] text-white border-0 font-bold"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            Kirim Undangan via WhatsApp
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
            className="w-full h-12 font-bold"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#144D3A]" />
                Tautan Berhasil Disalin
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Tautan Undangan
              </>
            )}
          </Button>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] justify-center pt-2">
          <ShieldCheck className="w-4 h-4 text-[#144D3A]" />
          Data keuangan hanya bisa diakses oleh anggota keluarga yang disetujui.
        </div>
      </div>
    </Modal>
  );
};
