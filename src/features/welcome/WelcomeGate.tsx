import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Globe, Smartphone } from 'lucide-react';
import { PwaInstallGuideModal } from '../pwa/PwaInstallGuideModal';

interface WelcomeGateProps {
  onStartSignup: () => void;
  onStartLogin: () => void;
  onStartDemo: () => void;
  onViewLanding: () => void;
}

/**
 * Official Welcome Gate / First-Time Mobile Screen
 * Matches the warm, calm couple illustration with LEGAKU brand tokens.
 */
export const WelcomeGate: React.FC<WelcomeGateProps> = ({
  onStartSignup,
  onStartLogin,
  onStartDemo,
  onViewLanding,
}) => {
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [betaCode, setBetaCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const beta = params.get('beta');
      if (beta) {
        setBetaCode(beta);
        localStorage.setItem('legaku_beta_access_token', beta);
      } else {
        const stored = localStorage.getItem('legaku_beta_access_token');
        if (stored) setBetaCode(stored);
      }
    }
  }, []);

  return (
    <div className="min-h-screen sm:py-6 sm:px-4 flex items-center justify-center bg-[#F3F6F4] font-sans antialiased selection:bg-[#E8F2EC]">
      {/* App frame container: 100dvh on mobile, clean phone frame on desktop */}
      <div className="w-full max-w-md h-[100dvh] sm:h-[780px] sm:max-h-[92vh] bg-white sm:rounded-[36px] shadow-2xl sm:border sm:border-[#E5E7EB] flex flex-col justify-between overflow-hidden relative animate-in fade-in duration-500">
        
        {/* Top Illustration Area with built-in official logo & couple artwork */}
        <div className="relative w-full bg-[#E5F1EB] overflow-hidden flex-1 min-h-[290px] flex items-center justify-center">
          <img
            src="/welcome-illustration.jpg"
            alt="LEGAKU - Atur uang. Hidup lebih lega."
            className="w-full h-full object-cover object-bottom select-none pointer-events-none block animate-in fade-in zoom-in-95 duration-700"
            loading="eager"
          />

          {/* Top action pills */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
            {/* PWA Install Guide button */}
            <button
              onClick={() => setShowPwaGuide(true)}
              className="px-3 py-1.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/80 text-[#144D3A] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Cara pasang di iPhone / Android"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#2E7D61]" />
              <span>Pasang di HP</span>
            </button>

            {/* Desktop/mobile website switcher pill */}
            <button
              onClick={onViewLanding}
              className="px-3 py-1.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/80 text-[#144D3A] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Lihat website & fitur lengkap"
            >
              <Globe className="w-3.5 h-3.5 text-[#2E7D61]" />
              <span>Website</span>
            </button>
          </div>
        </div>

        {/* Bottom Card Area with Quote & Action CTAs */}
        <div className="shrink-0 bg-white px-6 pt-3 pb-6 sm:pb-7 flex flex-col items-center gap-3 w-full border-t border-[#F3F6F4]">
          {/* Beta Access Badge (if invited) */}
          {betaCode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F2EC] text-[#144D3A] text-[11px] font-bold border border-[#2E7D61]/25 animate-in fade-in">
              <Sparkles className="w-3 h-3 text-[#2E7D61]" />
              <span>Undangan Beta Aktif: {betaCode}</span>
            </div>
          )}

          {/* Emotional Quote */}
          <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
            <h2 className="text-[16px] sm:text-[18px] font-bold text-[#1F2937] leading-snug tracking-tight max-w-[280px] sm:max-w-[320px] mx-auto">
              Keuangan yang baik membawa lebih banyak waktu untuk hal yang kamu cintai.
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {/* Primary CTA: Mulai Sekarang */}
            <button
              onClick={onStartSignup}
              className="w-full h-12 rounded-2xl bg-[#144D3A] hover:bg-[#1B5E46] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-soft hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Secondary CTA: Saya sudah punya akun */}
            <button
              onClick={onStartLogin}
              className="w-full h-12 rounded-2xl bg-[#E8F2EC] hover:bg-[#d9ecdf] text-[#144D3A] font-bold text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer"
            >
              Saya sudah punya akun
            </button>

            {/* Interactive Demo Mode Exploration link */}
            <div className="pt-1 text-center">
              <button
                onClick={onStartDemo}
                className="text-xs font-semibold text-[#2E7D61] hover:text-[#144D3A] inline-flex items-center gap-1.5 transition-colors py-0.5 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coba Eksplorasi Demo Mode</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* PWA Install Guide Modal */}
      <PwaInstallGuideModal
        isOpen={showPwaGuide}
        onClose={() => setShowPwaGuide(false)}
      />
    </div>
  );
};
