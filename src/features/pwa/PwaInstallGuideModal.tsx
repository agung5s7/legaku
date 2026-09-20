import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Smartphone, Share, PlusSquare, MoreVertical, DownloadCloud, CheckCircle2, Globe } from 'lucide-react';
import { LeafMark } from '../../components/ui/Logo';

interface PwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallGuideModal: React.FC<PwaInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  // Auto-detect OS if possible
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setPlatform('android');
      }
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Panduan Pasang LEGAKU di HP"
      subtitle="Nikmati pengalaman aplikasi standalone tanpa address bar browser."
      size="md"
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Platform Selector Tabs */}
        <div className="flex bg-[#E8F2EC] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setPlatform('ios')}
            className={`flex-1 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              platform === 'ios'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone (iOS Safari)</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('android')}
            className={`flex-1 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              platform === 'android'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Android (Chrome)</span>
          </button>
        </div>

        {/* Brand preview banner */}
        <div className="p-3.5 rounded-2xl bg-[#F9FAF7] border border-[#E5E7EB] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center shrink-0 shadow-xs">
            <LeafMark size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[#144D3A] text-xs">LEGAKU PWA</h4>
            <p className="text-[11px] text-[#6B7280] truncate">
              Cepat, ringan, hemat baterai, & dapat diakses offline saat sinyal lemah.
            </p>
          </div>
        </div>

        {/* STEP BY STEP: iOS */}
        {platform === 'ios' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937]">Buka di Browser Safari</p>
                <p className="text-[#6B7280] text-[11px]">
                  Pastikan tautan LEGAKU dibuka menggunakan browser bawaan <strong>Safari</strong> (bukan browser in-app WhatsApp/Instagram).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <span>Tekan Tombol Share</span>
                  <Share className="w-3.5 h-3.5 text-[#2E7D61]" />
                </p>
                <p className="text-[#6B7280] text-[11px]">
                  Sentuh ikon <strong>Share</strong> (kotak dengan panah ke atas) di bagian bawah layar Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <span>Pilih "Add to Home Screen"</span>
                  <PlusSquare className="w-3.5 h-3.5 text-[#2E7D61]" />
                </p>
                <p className="text-[#6B7280] text-[11px]">
                  Gulir ke bawah pada menu pop-up, lalu pilih <strong>"Add to Home Screen"</strong> (atau <em>Tambahkan ke Layar Utama</em>).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937]">Tekan "Add" di Kanan Atas</p>
                <p className="text-[#6B7280] text-[11px]">
                  Ikon daun LEGAKU akan otomatis muncul di Home Screen ponsel Anda seperti aplikasi App Store!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP BY STEP: ANDROID */}
        {platform === 'android' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937]">Buka di Google Chrome</p>
                <p className="text-[#6B7280] text-[11px]">
                  Buka alamat URL LEGAKU langsung di browser <strong>Google Chrome</strong> Android Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <span>Tekan Menu Titik Tiga</span>
                  <MoreVertical className="w-3.5 h-3.5 text-[#2E7D61]" />
                </p>
                <p className="text-[#6B7280] text-[11px]">
                  Sentuh menu titik tiga (<strong>⋮</strong>) di sudut kanan atas browser Chrome.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <span>Pilih "Install app" / "Tambahkan ke Layar Utama"</span>
                  <DownloadCloud className="w-3.5 h-3.5 text-[#2E7D61]" />
                </p>
                <p className="text-[#6B7280] text-[11px]">
                  Tekan tombol konfirmasi <strong>"Install"</strong> ketika jendela dialog muncul.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E5E7EB]">
              <div className="w-6 h-6 rounded-full bg-[#144D3A] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-bold text-[#1F2937]">Selesai!</p>
                <p className="text-[#6B7280] text-[11px]">
                  Aplikasi LEGAKU langsung terpasang di laci aplikasi HP Anda dan siap digunakan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-[#6B7280] flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" />
          <span>Tidak memakan memori penyimpanan besar (&lt; 2 MB).</span>
        </div>
      </div>
    </Modal>
  );
};
