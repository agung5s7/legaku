import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Heart, X, ArrowRight, Star } from 'lucide-react';
import { Plan, Subscription, PlanSlug } from '../../types';
import { DEMO_PLANS } from '../../lib/demoData';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription?: Subscription | null;
  featureTriggered?: string;
  onOpenComparison: () => void;
  onSelectPlan?: (planSlug: PlanSlug) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  featureTriggered = 'Fitur Eksklusif',
  onOpenComparison,
  onSelectPlan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-[#E5E7EB]">
        {/* Header */}
        <div className="bg-[#144D3A] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-[#D6C6AC]" />
            Pendamping Finansial Tanpa Batas
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Ruang Lebih Lapang untuk Keluarga
          </h2>
          <p className="text-white/80 text-xs mt-1 leading-relaxed">
            LEGAKU AI telah mendampingi Anda bulan ini. Upgrade untuk menikmati akses tanpa batas dengan penuh ketenangan.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-[#1F2937]">
          <div className="p-4 rounded-2xl bg-[#E8F2EC] border border-[#E8F2EC] text-xs text-[#144D3A] flex items-start gap-3">
            <Heart size={18} className="text-[#144D3A] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold mb-0.5">Filosofi Ketenangan LEGAKU</strong>
              Kami tidak membebani Anda dengan iklan atau penjualan data pribadi. Layanan ini sepenuhnya didukung oleh pengguna kami secara transparan.
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Keunggulan Paket Langganan:
            </p>
            <div className="space-y-2 text-xs text-[#1F2937]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                <span>Percakapan & konsultasi AI Companion tanpa batas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                <span>AI Receipt Scanner & Voice Transaksi harian sepuasnya</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                <span>Akses penuh Simulator Skenario & Cek Kesehatan Finansial</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                <span>Multi-user keluarga sinkron secara realtime (Paket Family)</span>
              </div>
            </div>
          </div>

          {/* Quick Choice Card */}
          <div className="p-4 rounded-2xl border-2 border-[#144D3A] bg-[#E8F2EC]/60 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#144D3A] bg-[#E8F2EC] px-2 py-0.5 rounded-full mb-1">
                <Star size={12} className="fill-[#144D3A] text-[#144D3A]" /> Pilihan Favorit
              </div>
              <div className="text-sm font-bold text-[#1F2937]">Paket Family</div>
              <div className="text-xs text-[#6B7280]">Rp 49.000 / bulan (hingga 5 akun)</div>
            </div>
            {onSelectPlan && (
              <button
                type="button"
                onClick={() => {
                  onSelectPlan('family');
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#144D3A] text-white font-bold text-xs hover:bg-[#2E7D61] transition-colors shadow-sm cursor-pointer"
              >
                Pilih Family
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9FAF7] border-t border-[#E5E7EB] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenComparison();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-[#1F2937] font-semibold text-xs hover:bg-[#E8F2EC] transition-colors text-center cursor-pointer"
          >
            Bandingkan Semua Paket (Free, Plus, Family, Founder)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-[#9CA3AF] font-medium text-xs hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
