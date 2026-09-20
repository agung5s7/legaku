import React, { useMemo, useState } from 'react';
import { BarChart3, Users, Sparkles, TrendingUp, ShieldCheck, Award, X, Activity, RefreshCw } from 'lucide-react';
import { calculateActiveFamilyHealth, getStoredEvents, clearStoredEvents } from '../../services/analytics/productAnalytics';
import { PlanSlug } from '../../types';

interface InternalAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanSlug: PlanSlug;
  onGrantFounder: () => void;
}

export const InternalAnalyticsModal: React.FC<InternalAnalyticsModalProps> = ({
  isOpen,
  onClose,
  currentPlanSlug,
  onGrantFounder,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const affData = useMemo(() => {
    return calculateActiveFamilyHealth();
  }, [refreshTrigger]);

  const rawEvents = useMemo(() => {
    return getStoredEvents();
  }, [refreshTrigger]);

  if (!isOpen) return null;

  // Funnel steps simulation
  const funnelSteps = [
    { name: '1. App Open', count: 124, pct: '100%' },
    { name: '2. Onboarding Complete', count: 98, pct: '79%' },
    { name: '3. First Transaction', count: 85, pct: '68%' },
    { name: '4. AI Feature Used', count: 64, pct: '51%' },
    { name: '5. Active Financial Family (30d)', count: affData.isActive ? 42 : 41, pct: '34%' },
    { name: '6. Subscribed (Plus / Family / Founder)', count: currentPlanSlug !== 'free' ? 14 : 13, pct: '11%' },
  ];

  const handleResetEvents = () => {
    clearStoredEvents();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/30">
            <Activity size={14} className="text-indigo-400" />
            Internal Product Telemetry & Metrics
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            LEGAKU Growth & Validation Dashboard
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            North Star: Active Financial Families (AFF) & Non-Intrusive Privacy-Preserving Telemetry.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {/* North Star Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  🎯
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Active Financial Families (AFF) Metric
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Keluarga yang aktif berinteraksi &gt;= 2 kali dalam 30 hari terakhir
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  affData.isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {affData.isActive ? 'Status: ACTIVE FAMILY' : 'Status: INACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mt-4">
              <div className="p-3 rounded-2xl bg-white/90 border border-emerald-100">
                <div className="text-xs text-slate-500 font-medium">Interaksi 30 Hari</div>
                <div className="text-xl font-black text-emerald-800 mt-0.5">
                  {affData.interactionCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/90 border border-emerald-100">
                <div className="text-xs text-slate-500 font-medium">Engagement Score</div>
                <div className="text-xl font-black text-teal-800 mt-0.5">
                  {affData.healthScore}/100
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/90 border border-emerald-100">
                <div className="text-xs text-slate-500 font-medium">Paket Langganan</div>
                <div className="text-sm font-bold text-indigo-700 mt-1 uppercase">
                  {currentPlanSlug}
                </div>
              </div>
            </div>
          </div>

          {/* Product Funnel */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Funnel Konversi & Retensi Pengguna
            </h4>
            <div className="space-y-2">
              {funnelSteps.map((step, idx) => (
                <div
                  key={step.name}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-700">{step.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{step.count} user</span>
                    <span className="w-12 text-right font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {step.pct}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-slate-800 font-bold mb-0.5">
                Privasi Terjamin 100%
              </strong>
              Telemetri LEGAKU hanya mencatat nama aksi produk (misal: <code>view_dashboard</code>, <code>ai_companion_query</code>). Nominal uang, saldo rekening, isi chat, dan foto nota <strong>tidak pernah dicatat</strong> dalam log analitik.
            </div>
          </div>

          {/* Admin Fast Tools */}
          <div className="p-4 rounded-3xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Award size={16} className="text-amber-600" />
                Developer / Admin Fast Actions
              </h4>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Uji coba hak akses Founder Lifetime atau reset telemetry lokal.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onGrantFounder}
                disabled={currentPlanSlug === 'founder_lifetime'}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-sm"
              >
                {currentPlanSlug === 'founder_lifetime' ? 'Founder Aktif' : 'Grant Founder VIP'}
              </button>
              <button
                type="button"
                onClick={handleResetEvents}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1"
                title="Reset log telemetri lokal"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition-colors"
          >
            Tutup Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
