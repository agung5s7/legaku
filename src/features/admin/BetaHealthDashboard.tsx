import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useFinance } from '../../context/FinanceContext';
import { useFamily } from '../../context/FamilyContext';
import {
  getStoredEvents,
  calculateActiveFamilyHealth,
  getBetaFunnel,
} from '../../services/analytics/productAnalytics';
import { ErrorLoggingService } from '../../services/errorLogging';
import {
  Activity,
  Users,
  HeartPulse,
  TrendingUp,
  Receipt,
  Mic,
  Sparkles,
  Target,
  MessageSquare,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Download,
} from 'lucide-react';

interface BetaHealthDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaHealthDashboard: React.FC<BetaHealthDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const { transactions, goals, budgets } = useFinance();
  const { members } = useFamily();

  const [activeTab, setActiveTab] = useState<'metrics' | 'funnel' | 'feedback' | 'errors'>('metrics');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'bug' | 'saran' | 'pengalaman' | 'pertanyaan'>('all');

  const events = getStoredEvents();
  const aff = calculateActiveFamilyHealth(transactions, goals, budgets);
  const funnel = getBetaFunnel(transactions, goals, budgets);
  const errors = ErrorLoggingService.getLogs();

  // Read stored feedbacks
  const feedbacks = JSON.parse(localStorage.getItem('legaku_feedback_store') || '[]');
  const filteredFeedbacks = feedbacks.filter((f: any) =>
    feedbackFilter === 'all' ? true : f.type === feedbackFilter
  );

  // Telemetry aggregation: Strictly real data, no synthetic mock inflation
  const isCohortDataSufficient = false; // Rolling 30-day cohort requires elapsed beta time
  const totalBetaFamilies = members.length > 0 ? 1 : 0;

  // Real events only (no synthetic offsets)
  const aiChatCount = events.filter((e) =>
    ['first_ai_question'].includes(e.event_name)
  ).length;

  const receiptScanCount = events.filter((e) =>
    ['first_receipt_scan', 'receipt_scanned'].includes(e.event_name)
  ).length;

  const voiceTxCount = events.filter((e) =>
    ['first_voice_transaction', 'voice_transaction_created'].includes(e.event_name)
  ).length;

  const handleExportTelemetry = () => {
    const reportData = {
      project: 'LEGAKU — Family Finance & AI Companion',
      phase: 'Phase 6: Real-World Beta Pre-Release Audit',
      exported_at: new Date().toISOString(),
      telemetry_status: {
        stage: 'pre_release_early_beta',
        is_cohort_sufficient: isCohortDataSufficient,
        note: 'Metrik agregat cohort (7-Day, 30-Day retention, AFF Cohort) berstatus "Belum cukup data" dan menunggu akumulasi data cohort aktif bergulir dari pengguna beta sungguhan.',
      },
      current_family_health: {
        is_active_financial_family: aff.isActive,
        health_score: aff.healthScore,
        interaction_count: aff.interactionCount,
        criteria: aff.criteria,
      },
      cohort_metrics: {
        total_beta_families_tracked: totalBetaFamilies,
        aff_cohort_score: isCohortDataSufficient ? '0%' : 'Belum cukup data',
        retention_7d: isCohortDataSufficient ? '0%' : 'Belum cukup data',
        retention_30d: isCohortDataSufficient ? '0%' : 'Belum cukup data',
        feature_adoptions: {
          ai_chat_questions: aiChatCount,
          receipt_scans: receiptScanCount,
          voice_transactions: voiceTxCount,
        },
      },
      funnel_stages: funnel,
      feedbacks_summary: {
        total: feedbacks.length,
        items: feedbacks,
      },
      system_errors: {
        total: errors.length,
        items: errors,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legaku_beta_telemetry_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Beta Health & Observability Dashboard"
      subtitle="Telemetri internal untuk validasi produk dan kesehatan adopsi keluarga perintis (Tanpa Data Finansial Mentah)."
      size="lg"
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Tab Navigator */}
        <div className="flex bg-[#E8F2EC] p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Ringkasan Metrik
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`flex-1 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'funnel'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Beta Funnel
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'feedback'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedback ({feedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex-1 py-2 font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'errors'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Log Error ({errors.length})
          </button>
        </div>

        {/* TAB 1: METRICS SUMMARY */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* North Star Card */}
            <div className="bg-[#144D3A] text-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-[#D6C6AC] font-bold">
                    North Star Metric (AFF Cohort)
                  </span>
                  <span className="bg-[#D6C6AC]/20 text-[#D6C6AC] text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Tahap Pengumpulan Data
                  </span>
                </div>
                <span className="bg-[#E8F2EC]/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Target: ≥70%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Active Financial Families</h3>
                  <p className="text-[11px] text-emerald-100/70 mt-0.5">
                    Keluarga Saat Ini: <span className="font-semibold text-white">{aff.isActive ? 'Aktif (Memenuhi AFF)' : 'Belum Memenuhi Kriteria'}</span> ({aff.interactionCount}/2 interaksi)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#D6C6AC] bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                    Belum cukup data
                  </span>
                  <p className="text-[10px] text-emerald-200/60 mt-1">Skor Akun: {aff.healthScore}%</p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-100/80 leading-relaxed pt-2 border-t border-emerald-800/40">
                Definisi: Keluarga yang melakukan interaksi finansial minimal 2 kali dalam jendela rolling 30 hari. Metrik agregat cohort akan terisi otomatis setelah pengguna beta aktif berjalan.
              </p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 shadow-2xs">
                <span className="text-[#6B7280] text-[11px] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#144D3A]" /> Total Keluarga (Lokal)
                </span>
                <p className="text-lg font-bold text-[#1F2937]">{totalBetaFamilies}</p>
                <p className="text-[10px] text-[#2E7D61]">{members.length} anggota keluarga aktif</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 shadow-2xs">
                <span className="text-[#6B7280] text-[11px] flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-[#2E7D61]" /> 7-Day Retention
                </span>
                <p className="text-sm font-bold text-[#6B7280]">Belum cukup data</p>
                <p className="text-[10px] text-[#6B7280]">Menunggu rolling 7 hari</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 shadow-2xs">
                <span className="text-[#6B7280] text-[11px] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#144D3A]" /> 30-Day Retention
                </span>
                <p className="text-sm font-bold text-[#6B7280]">Belum cukup data</p>
                <p className="text-[10px] text-[#6B7280]">Menunggu rolling 30 hari</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 shadow-2xs">
                <span className="text-[#6B7280] text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#144D3A]" /> Tanya AI
                </span>
                <p className="text-lg font-bold text-[#1F2937]">{aiChatCount}</p>
                <p className="text-[10px] text-[#6B7280]">{aiChatCount > 0 ? 'Interaksi terekam' : 'Belum ada interaksi'}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 shadow-2xs">
                <span className="text-[#6B7280] text-[11px] flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-[#144D3A]" /> Scan Struk OCR
                </span>
                <p className="text-lg font-bold text-[#1F2937]">{receiptScanCount}</p>
                <p className="text-[10px] text-[#6B7280]">{receiptScanCount > 0 ? 'Struk diproses' : 'Belum ada scan'}</p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1 shadow-2xs">
                <span className="text-[#6B7280] text-[11px] flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5 text-[#144D3A]" /> Suara Finansial
                </span>
                <p className="text-lg font-bold text-[#1F2937]">{voiceTxCount}</p>
                <p className="text-[10px] text-[#6B7280]">{voiceTxCount > 0 ? 'Input suara tercatat' : 'Belum ada rekaman'}</p>
              </div>
            </div>

            <div className="p-3 bg-[#E8F2EC] rounded-2xl border border-[#d5e7dc] flex items-center gap-2 text-[11px] text-[#144D3A]">
              <ShieldCheck className="w-4 h-4 text-[#2E7D61] shrink-0" />
              <span>Privasi Terlindungi: Angka nominal rupiah atau data transaksi privat keluarga tidak pernah masuk ke analitik.</span>
            </div>
          </div>
        )}

        {/* TAB 2: BETA FUNNEL */}
        {activeTab === 'funnel' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#6B7280]">
              Tahapan konversi keluarga dari pertama menerima undangan hingga menjadi keluarga finansial aktif 30 hari:
            </p>
            <div className="space-y-2">
              {funnel.map((step, idx) => (
                <div
                  key={step.name}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F2937]">
                      {idx + 1}. {step.name}
                    </span>
                    <span className="font-mono font-bold text-[#144D3A]">
                      {step.count} ({step.conversionPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#144D3A] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${step.conversionPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7280]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="space-y-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              {(['all', 'bug', 'saran', 'pengalaman', 'pertanyaan'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFeedbackFilter(filter)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                    feedbackFilter === filter
                      ? 'bg-[#144D3A] text-white'
                      : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAF7]'
                  }`}
                >
                  {filter === 'all' ? 'Semua' : filter.toUpperCase()}
                </button>
              ))}
            </div>

            {filteredFeedbacks.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-[#6B7280]">
                Belum ada feedback yang tercatat pada kategori ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredFeedbacks.map((fb: any) => (
                  <div
                    key={fb.id}
                    className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F2937]">{fb.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F2EC] text-[#144D3A] uppercase">
                        {fb.type}
                      </span>
                    </div>
                    <p className="text-[#6B7280] leading-relaxed">{fb.message}</p>
                    <span className="text-[10px] text-[#9CA3AF] block">
                      {new Date(fb.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SANITIZED ERROR LOGS */}
        {activeTab === 'errors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B7280]">
                Log kesalahan frontend (Data finansial telah disanitasi secara otomatis):
              </span>
              {errors.length > 0 && (
                <button
                  onClick={() => {
                    ErrorLoggingService.clearLogs();
                    setActiveTab('metrics');
                  }}
                  className="text-[11px] text-[#EF4444] font-semibold hover:underline cursor-pointer"
                >
                  Bersihkan Log
                </button>
              )}
            </div>

            {errors.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center text-[#2E7D61] font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D61]" />
                Sistem berjalan sangat stabil. Tidak ada log kesalahan tercatat.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {errors.map((err) => (
                  <div
                    key={err.id}
                    className="bg-white border border-[#EF4444]/20 rounded-2xl p-3 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[#EF4444] font-bold">{err.source}</span>
                      <span className="text-[#9CA3AF]">
                        {new Date(err.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <p className="font-semibold text-[#1F2937]">{err.message}</p>
                    {err.componentStack && (
                      <pre className="p-2 bg-[#F9FAF7] rounded-xl text-[10px] text-[#6B7280] overflow-x-auto">
                        {err.componentStack}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOOTER ACTION BAR */}
        <div className="pt-3 mt-2 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D61]" />
            <span>Privasi Terjamin: Nol nominal rupiah & transaksi mentah.</span>
          </div>

          <button
            type="button"
            onClick={handleExportTelemetry}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#144D3A] hover:bg-[#1B5E46] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Laporan Telemetri (JSON)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
