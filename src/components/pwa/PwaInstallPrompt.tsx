import React, { useState, useEffect } from 'react';
import { LeafMark } from '../ui/Logo';
import { Download, X, Smartphone, Apple, Monitor, ChevronRight } from 'lucide-react';
import { trackEvent } from '../../services/analytics/productAnalytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(inStandalone);

    if (inStandalone) return;

    // Check dismissed timestamp in localStorage
    const dismissedAt = localStorage.getItem('legaku_pwa_dismissed');
    if (dismissedAt) {
      const daysDiff = (Date.now() - Number(dismissedAt)) / (1000 * 3600 * 24);
      if (daysDiff < 7) return; // don't nag user for 7 days
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If iOS or unsupported browser, still gently show guide after 5 seconds on first visit
    const timer = setTimeout(() => {
      if (!inStandalone && !dismissedAt) {
        setIsVisible(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          trackEvent('app_installed');
          setIsVisible(false);
        }
        setDeferredPrompt(null);
      } catch {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('legaku_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !isVisible) return null;

  return (
    <>
      {/* Gentle Floating Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-fade-in font-sans">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center shrink-0">
              <LeafMark size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#144D3A] leading-tight">
                Pasang LEGAKU di HP
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">
                Akses keuangan keluarga lebih cepat & tenang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-[#144D3A] hover:bg-[#0E372A] text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3 h-3" />
              Pasang
            </button>
            <button
              onClick={handleDismiss}
              className="text-[#9CA3AF] hover:text-[#1F2937] p-1.5 rounded-lg cursor-pointer"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Guidance Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] flex items-center justify-center">
                  <LeafMark size={18} />
                </div>
                <h3 className="text-sm font-bold text-[#144D3A]">Cara Pasang LEGAKU</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-[#9CA3AF] hover:text-[#1F2937] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* iOS Safari */}
              <div className="p-3 bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                  <Apple className="w-4 h-4 text-[#144D3A]" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  1. Ketuk tombol <strong>Share</strong> (ikon kotak berpanah ke atas) di bagian bawah Safari.<br />
                  2. Geser ke bawah lalu pilih <strong>Tambah ke Layar Utama</strong> (Add to Home Screen).
                </p>
              </div>

              {/* Android Chrome */}
              <div className="p-3 bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                  <Smartphone className="w-4 h-4 text-[#144D3A]" />
                  <span>Android (Chrome / Browser)</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  1. Ketuk menu titik tiga (⋮) di pojok kanan atas browser.<br />
                  2. Pilih <strong>Pasang Aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.
                </p>
              </div>

              {/* Desktop */}
              <div className="p-3 bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1F2937]">
                  <Monitor className="w-4 h-4 text-[#144D3A]" />
                  <span>Laptop / Komputer (Chrome/Edge)</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Klik ikon instalasi di sebelah kanan bilah alamat (URL bar) untuk menggunakan LEGAKU sebagai aplikasi mandiri.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-[#144D3A] text-white text-xs font-semibold py-3 rounded-2xl cursor-pointer hover:bg-[#0E372A] transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
