import React, { useState } from 'react';
import { CheckCircle2, Star, ShieldCheck, X, Sparkles, KeyRound, Award } from 'lucide-react';
import { PlanSlug, Subscription } from '../../types';
import { EntitlementService } from '../../services/entitlements/entitlementsService';
import { DEMO_PLANS } from '../../lib/demoData';
import { formatRupiah } from '../../utils/formatters';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription?: Subscription | null;
  onUpdateSubscription: (planSlug: PlanSlug) => void;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  onUpdateSubscription,
}) => {
  const [founderCode, setFounderCode] = useState<string>('');
  const [founderError, setFounderError] = useState<string | null>(null);
  const [founderSuccess, setFounderSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentSlug = currentSubscription?.plan?.slug || 'free';

  const handleApplyFounderCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFounderError(null);
    const result = await EntitlementService.redeemFounderCode(founderCode);

    if (result.success) {
      setFounderSuccess(true);
      onUpdateSubscription('founder_lifetime');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFounderError(result.message);
    }
  };

  const handleSelectPlan = (slug: PlanSlug) => {
    onUpdateSubscription(slug);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-emerald-100">
        {/* Header */}
        <div className="bg-[#144D3A] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-[#D6C6AC]" />
            Paket Transparan & Adil
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Pilihan Paket Pendampingan Finansial
          </h2>
          <p className="text-white/80 text-xs mt-1">
            Pilih paket yang paling pas untuk ritme dan kebutuhan keluarga Anda.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-[#1F2937]">
          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Free */}
            <div
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                currentSlug === 'free'
                  ? 'border-[#144D3A] bg-[#E8F2EC]/40 ring-2 ring-[#144D3A]/20'
                  : 'border-[#E5E7EB] bg-white hover:border-[#9CA3AF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#1F2937]">Free</h3>
                  {currentSlug === 'free' && (
                    <span className="text-[10px] font-bold bg-[#E8F2EC] text-[#144D3A] px-2 py-0.5 rounded-full">
                      Paket Aktif
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-[#1F2937] mb-1">Rp 0</div>
                <p className="text-xs text-[#6B7280] mb-4">Gratis selamanya untuk personal</p>
                <div className="space-y-2 text-xs text-[#1F2937] mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>15 pesan AI Companion / bln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>5 AI Receipt scan / bln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>5 Transaksi suara / bln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>Pencatatan akun & transfer</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPlan('free')}
                disabled={currentSlug === 'free'}
                className="w-full py-2.5 rounded-xl border border-[#E5E7EB] text-[#1F2937] font-bold text-xs hover:bg-[#E8F2EC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {currentSlug === 'free' ? 'Sedang Digunakan' : 'Gunakan Free'}
              </button>
            </div>

            {/* 2. Plus */}
            <div
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                currentSlug === 'plus'
                  ? 'border-[#2E7D61] bg-[#E8F2EC]/40 ring-2 ring-[#2E7D61]/20'
                  : 'border-[#E5E7EB] bg-white hover:border-[#9CA3AF]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#1F2937]">Plus</h3>
                  {currentSlug === 'plus' && (
                    <span className="text-[10px] font-bold bg-[#2E7D61] text-white px-2 py-0.5 rounded-full">
                      Paket Aktif
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-[#1F2937] mb-1">
                  Rp 29.000 <span className="text-xs font-normal text-[#6B7280]">/bln</span>
                </div>
                <p className="text-xs text-[#6B7280] mb-4">Kenyamanan ekstra untuk perorangan</p>
                <div className="space-y-2 text-xs text-[#1F2937] mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#2E7D61] shrink-0" />
                    <span>150 pesan AI Companion / bln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#2E7D61] shrink-0" />
                    <span>50 AI Receipt scan / bln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#2E7D61] shrink-0" />
                    <span>50 Transaksi suara / bln</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#2E7D61] shrink-0" />
                    <span>Simulator Skenario Impian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#2E7D61] shrink-0" />
                    <span>Cek Kesehatan Finansial</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPlan('plus')}
                disabled={currentSlug === 'plus'}
                className="w-full py-2.5 rounded-xl bg-[#2E7D61] text-white font-bold text-xs hover:bg-[#144D3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                {currentSlug === 'plus' ? 'Sedang Digunakan' : 'Pilih Plus'}
              </button>
            </div>

            {/* 3. Family */}
            <div
              className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between relative ${
                currentSlug === 'family'
                  ? 'border-[#144D3A] bg-[#E8F2EC]/60 ring-2 ring-[#144D3A]/20'
                  : 'border-[#144D3A] bg-[#E8F2EC]/30 hover:border-[#144D3A] shadow-sm'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#144D3A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Star size={10} className="fill-white" /> Paling Populer
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-[#144D3A]">Family</h3>
                  {currentSlug === 'family' && (
                    <span className="text-[10px] font-bold bg-[#144D3A] text-white px-2 py-0.5 rounded-full">
                      Paket Aktif
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-[#144D3A] mb-1">
                  Rp 49.000 <span className="text-xs font-normal text-[#6B7280]">/bln</span>
                </div>
                <p className="text-xs text-[#144D3A]/80 mb-4">Hingga 5 akun pasangan & keluarga</p>
                <div className="space-y-2 text-xs text-[#1F2937] mb-6">
                  <div className="flex items-center gap-2 font-semibold text-[#144D3A]">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>Akses AI Companion Sepuasnya</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>Scan struk & suara tanpa kuota</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>Multi-user keluarga sinkron</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>Laporan PDF & Ekspor CSV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#144D3A] shrink-0" />
                    <span>Prioritas respon & enkripsi</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPlan('family')}
                disabled={currentSlug === 'family'}
                className="w-full py-2.5 rounded-xl bg-[#144D3A] text-white font-bold text-xs hover:bg-[#2E7D61] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                {currentSlug === 'family' ? 'Sedang Digunakan' : 'Pilih Family'}
              </button>
            </div>
          </div>

          {/* Founder Lifetime Secret Section */}
          <div className="p-4 rounded-3xl bg-[#144D3A] text-white flex flex-col md:flex-row items-center justify-between gap-4 border border-[#144D3A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 text-[#D6C6AC] flex items-center justify-center shrink-0">
                <Award size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Akses Founder Lifetime (VIP)</h4>
                  {currentSlug === 'founder_lifetime' && (
                    <span className="text-[10px] font-bold bg-[#D6C6AC] text-[#144D3A] px-2 py-0.2 rounded-full">
                      Aktif Seumur Hidup
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/70 mt-0.5">
                  Punya kode voucher VIP / early supporter? Masukkan untuk aktifkan selamanya.
                </p>
              </div>
            </div>

            <form onSubmit={handleApplyFounderCode} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Kode Akses VIP / Supporter"
                value={founderCode}
                onChange={e => setFounderCode(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white flex-1 md:w-56"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-white text-[#144D3A] font-bold text-xs hover:bg-[#E8F2EC] transition-colors shrink-0 cursor-pointer"
              >
                Klaim
              </button>
            </form>
          </div>

          {founderSuccess && (
            <div className="p-3 rounded-2xl bg-[#22C55E] text-white text-xs font-semibold text-center animate-in fade-in">
              🎉 Selamat! Akses Founder Lifetime telah aktif selamanya untuk keluarga Anda!
            </div>
          )}
          {founderError && (
            <div className="p-3 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-medium text-center">
              {founderError}
            </div>
          )}

          {/* Guarantee notice */}
          <div className="flex items-center justify-center gap-2 text-[#6B7280] text-xs">
            <ShieldCheck size={16} className="text-[#144D3A]" />
            <span>Tanpa kontrak terikat. Anda dapat membatalkan atau mengubah paket kapan saja.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
