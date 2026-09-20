import React, { useState } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Users, Heart, ArrowRight, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { createFamily, joinFamily } = useFamily();

  const [step, setStep] = useState<'choose' | 'create' | 'join' | 'invite'>('choose');
  const [familyName, setFamilyName] = useState('Keluarga Bahagia');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [createdInviteCode, setCreatedInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setErrorMsg('Nama keluarga tidak boleh kosong.');
      return;
    }
    setIsLoading(true);
    const res = await createFamily(familyName.trim());
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.family) {
      setCreatedInviteCode(res.family.invite_code);
      setStep('invite');
      confetti({
        particleCount: 30,
        spread: 55,
      });
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      setErrorMsg('Masukkan kode undangan.');
      return;
    }
    setIsLoading(true);
    const res = await joinFamily(inviteCodeInput.trim());
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      confetti({
        particleCount: 40,
        spread: 60,
      });
      onComplete();
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(createdInviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Selamat Datang di LEGAKU"
      subtitle="Teman keluarga untuk memahami uang dan merencanakan masa depan."
    >
      <div className="space-y-4 pt-1">
        {/* STEP 1: CHOOSE (Create vs Join) */}
        {step === 'choose' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-warm-muted text-center max-w-xs mx-auto">
              Mulai kelola keuangan rumah tangga secara kolaboratif bersama pasangan Anda.
            </p>

            <button
              onClick={() => {
                setErrorMsg('');
                setStep('create');
              }}
              className="w-full p-4 bg-white border border-warm-border rounded-2xl text-left hover:border-forest-600 hover:bg-sage-50/50 transition-all flex items-center justify-between group shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-forest-950">Buat Keluarga Baru</h4>
                  <p className="text-xs text-warm-muted">Saya adalah pengelola pertama keluarga ini</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-warm-muted group-hover:text-forest-800 transition-colors" />
            </button>

            <button
              onClick={() => {
                setErrorMsg('');
                setStep('join');
              }}
              className="w-full p-4 bg-white border border-warm-border rounded-2xl text-left hover:border-forest-600 hover:bg-sage-50/50 transition-all flex items-center justify-between group shadow-soft"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 text-forest-800 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-forest-950">Gabung ke Keluarga</h4>
                  <p className="text-xs text-warm-muted">Saya punya kode undangan dari pasangan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-warm-muted group-hover:text-forest-800 transition-colors" />
            </button>
          </div>
        )}

        {/* STEP 2: CREATE FAMILY */}
        {step === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <Input
              label="Nama Keluarga"
              placeholder="Contoh: Keluarga Bahagia, Keluarga Andi & Sinta"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              autoFocus
            />

            {errorMsg && <p className="text-xs text-earth-rust">{errorMsg}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('choose')} className="flex-1">
                Kembali
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Lanjutkan
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: JOIN FAMILY */}
        {step === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4 py-2">
            <Input
              label="Kode Undangan Keluarga"
              placeholder="LEGAKU-XXXXXX"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              autoFocus
            />

            <p className="text-[11px] text-warm-muted">
              Contoh kode demo: <code className="font-mono font-bold text-forest-800">LEGAKU-AB12CD</code>
            </p>

            {errorMsg && <p className="text-xs text-earth-rust">{errorMsg}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('choose')} className="flex-1">
                Kembali
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                Gabung Sekarang
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: INVITE PARTNER */}
        {step === 'invite' && (
          <div className="space-y-4 py-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sage-100 text-forest-800 flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-forest-950">Undang Pasangan Anda</h3>
              <p className="text-xs text-warm-muted max-w-xs mx-auto mt-1">
                Bagikan kode ini agar pasangan dapat ikut melihat dan mencatat keuangan bersama.
              </p>
            </div>

            <div className="bg-cream-50 border-2 border-dashed border-sage-300 rounded-2xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-forest-900">
              {createdInviteCode}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyCode}
              className="w-full text-xs"
            >
              {copied ? 'Kode Berhasil Disalin!' : 'Salin Kode Undangan'}
            </Button>

            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={onComplete}
                className="w-full h-12"
              >
                Mulai Gunakan LEGAKU
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
