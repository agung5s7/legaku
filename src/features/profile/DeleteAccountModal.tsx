import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AlertTriangle, ShieldAlert, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, isDemoMode } = useAuth();
  const { family, members } = useFamily();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const CONFIRM_PHRASE = 'HAPUS AKUN SAYA';

  const handleExecuteDelete = async () => {
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      setErrorMessage(`Silakan ketik "${CONFIRM_PHRASE}" persis untuk melanjutkan.`);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (isSupabaseConfigured && !isDemoMode && user) {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
      }

      // Clear local storage data for safety
      localStorage.removeItem('legaku_onboarded');
      localStorage.removeItem('legaku_demo_user');
      localStorage.removeItem('legaku_active_family');

      // Logout and reset app state
      await logout();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses penghapusan akun.';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const isOnlyMember = members.length <= 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          setStep(1);
          setConfirmText('');
          setErrorMessage('');
          onClose();
        }
      }}
      title="Penghapusan Akun Permanen"
      size="md"
    >
      <div className="space-y-4 font-sans">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-[#6B7280]">
          <span className={step >= 1 ? 'text-[#EF4444] font-bold' : ''}>1. Peringatan</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-[#EF4444] font-bold' : ''}>2. Dampak Data</span>
          <span>→</span>
          <span className={step === 3 ? 'text-[#EF4444] font-bold' : ''}>3. Konfirmasi Akhir</span>
        </div>

        {/* STEP 1: WARNING */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#EF4444]">Tindakan Ini Tidak Dapat Dibatalkan</h4>
                <p className="text-xs text-[#1F2937] leading-relaxed">
                  Menghapus akun akan menghilangkan profil, preferensi, dan akses Anda ke seluruh layanan LEGAKU selamanya.
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-xs space-y-2.5">
              <p className="font-semibold text-[#1F2937]">Sebelum melanjutkan, pastikan:</p>
              <ul className="space-y-2 text-[#6B7280]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61] shrink-0 mt-0.5" />
                  <span>Anda telah mengunduh arsip data transaksi keluarga (CSV) jika masih membutuhkannya.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61] shrink-0 mt-0.5" />
                  <span>Anda telah mengonfirmasi dengan pasangan bila mengelola ruang keluarga bersama.</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-2xl py-3 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-2xl py-3 text-xs font-semibold"
              >
                Lanjut ke Penjelasan
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: EXPLANATION */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-[#1F2937]">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                <span>Apa yang terjadi pada data keluarga Anda?</span>
              </div>

              <div className="p-3 bg-[#F9FAF7] rounded-xl space-y-1.5 text-[#6B7280]">
                {isOnlyMember ? (
                  <p>
                    Karena Anda adalah satu-satunya anggota di <strong>Keluarga {family?.name}</strong>, seluruh catatan transaksi, rekening, target impian, dan anggaran akan <strong>dihapus permanen</strong> dari server.
                  </p>
                ) : (
                  <p>
                    Karena ada anggota keluarga lain (pasangan) di <strong>Keluarga {family?.name}</strong>, keanggotaan dan profil Anda akan dicabut. Hak pengelolaan ruang keluarga akan dialihkan secara aman kepada pasangan Anda agar catatan finansial keluarga tidak hilang mendadak.
                  </p>
                )}
              </div>

              <div className="space-y-1 text-[#6B7280]">
                <p>• Riwayat percakapan AI dan unggahan struk Anda akan dihapus.</p>
                <p>• Seluruh sesi perangkat aktif Anda akan langsung dihentikan.</p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 rounded-2xl py-3 text-xs"
              >
                Kembali
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-2xl py-3 text-xs font-semibold"
              >
                Saya Paham, Lanjut
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: FINAL CONFIRMATION */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-xs space-y-2 text-[#EF4444]">
              <p className="font-bold">Konfirmasi Penghapusan Terakhir</p>
              <p className="text-[#1F2937]">
                Untuk mencegah ketidaksengajaan, silakan ketik kata kunci di bawah ini:
              </p>
              <p className="font-mono font-bold text-sm bg-white p-2 rounded-xl text-center border border-[#EF4444]/30 select-all">
                {CONFIRM_PHRASE}
              </p>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Ketik "${CONFIRM_PHRASE}" di sini`}
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] focus:outline-none focus:border-[#EF4444] text-xs font-medium"
              />
              {errorMessage && (
                <p className="text-[11px] text-[#EF4444] font-medium px-1">{errorMessage}</p>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 rounded-2xl py-3 text-xs"
              >
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleExecuteDelete}
                disabled={loading || confirmText.trim() !== CONFIRM_PHRASE}
                className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-50 text-white rounded-2xl py-3 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Akun Permanen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
