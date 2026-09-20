import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { BetaInviteService, BetaInvite } from '../../services/betaInviteService';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, KeyRound, Copy, Check, Plus, ShieldCheck, Share2, MessageCircle, ExternalLink } from 'lucide-react';

interface BetaInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaInviteModal: React.FC<BetaInviteModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<BetaInvite[]>(BetaInviteService.getLocalInvites());
  const [newEmail, setNewEmail] = useState('');
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsCreating(true);
    try {
      const created = await BetaInviteService.createInvite(newEmail, user?.id);
      setInvites([created, ...invites]);
      setNewEmail('');
    } finally {
      setIsCreating(false);
    }
  };

  const getDirectLink = (token: string) => {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
    return origin ? `${origin}/?beta=${token}` : `/?beta=${token}`;
  };

  const handleCopyLink = (token: string) => {
    const link = getDirectLink(token);
    navigator.clipboard.writeText(link);
    setCopiedAction(`link-${token}`);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  const handleCopyWhatsAppMessage = (invite: BetaInvite) => {
    const link = getDirectLink(invite.invite_token);
    const text = `Halo! Kami mengundang kamu & pasangan untuk mencoba aplikasi finansial keluarga terbaru, *LEGAKU*.\n\n🌿 *Akses Beta Eksklusif*\nBuka tautan ini di HP: ${link}\nKode Akses: ${invite.invite_token}\n\nMari atur keuangan bersama dan hidup lebih lega!`;
    navigator.clipboard.writeText(text);
    setCopiedAction(`wa-${invite.invite_token}`);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sistem Akses Beta LEGAKU"
      subtitle="Kelola kode undangan beta dan tautan akses untuk keluarga perintis tahap awal."
      size="md"
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Banner */}
        <div className="p-3.5 bg-[#E8F2EC] rounded-2xl border border-[#d5e7dc] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#144D3A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#144D3A]">Akses Terbatas Beta (Cohort 20–50 Pasangan)</p>
            <p className="text-[#1F2937] leading-relaxed">
              Setiap token undangan bersifat unik, tidak sekuensial, dan memiliki masa aktif untuk menjaga privasi serta kenyamanan pengujian keluarga.
            </p>
          </div>
        </div>

        {/* Generate Invite Form */}
        <form onSubmit={handleCreateInvite} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
          <label className="font-bold text-[#1F2937] block">
            Kirim Undangan Beta Baru
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email.keluarga@gmail.com"
              className="flex-1 px-3.5 py-2.5 bg-[#F9FAF7] border border-[#E5E7EB] rounded-xl text-xs focus:outline-none focus:border-[#144D3A]"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isCreating}
              className="py-2.5 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Token
            </Button>
          </div>
        </form>

        {/* Invites List */}
        <div className="space-y-2">
          <h4 className="font-bold text-[#6B7280] uppercase tracking-wider text-[11px] px-1">
            Daftar Token & Tautan Undangan ({invites.length})
          </h4>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#144D3A] text-xs bg-[#E8F2EC] px-2 py-0.5 rounded-md">
                      {invite.invite_token}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        invite.status === 'active'
                          ? 'bg-[#E8F2EC] text-[#144D3A]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {invite.status === 'active' ? 'Aktif' : 'Tersedia'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">{invite.email}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#F3F6F4]">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(invite.invite_token)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#F9FAF7] hover:bg-[#E8F2EC] text-[#144D3A] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#E5E7EB]"
                    title="Salin Tautan Akses Langsung"
                  >
                    {copiedAction === `link-${invite.invite_token}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2E7D61]" />
                        <span>Tautan Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyWhatsAppMessage(invite)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#E8F2EC] hover:bg-[#d5e7dc] text-[#144D3A] font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Salin Template Pesan WhatsApp"
                  >
                    {copiedAction === `wa-${invite.invite_token}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2E7D61]" />
                        <span>Pesan WA Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Template WA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
