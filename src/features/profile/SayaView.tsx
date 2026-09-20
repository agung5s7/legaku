import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { useFinance } from '../../context/FinanceContext';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import {
  Users,
  Wallet,
  PieChart,
  Share2,
  LogOut,
  ChevronRight,
  Repeat,
  Bookmark,
  Bell,
  Sliders,
  History,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  HeartPulse,
  Compass,
  Sparkles,
  Award,
  Activity,
  MessageSquare,
  HelpCircle,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { RecurringView } from '../recurring/RecurringView';
import { TemplatesModal } from '../templates/TemplatesModal';
import { NotificationPreferencesModal } from '../notifications/NotificationPreferencesModal';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal';
import { FamilyActivityTimeline } from '../family/FamilyActivityTimeline';
import { CsvImportModal } from '../export/CsvImportModal';
import { ExportReportModal } from '../export/ExportReportModal';
import { PrivacyCenterModal } from '../privacy/PrivacyCenterModal';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { HelpCenterModal } from '../help/HelpCenterModal';
import { BetaInviteModal } from '../beta/BetaInviteModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import { BetaHealthDashboard } from '../admin/BetaHealthDashboard';
import { Subscription } from '../../types';

interface SayaViewProps {
  onOpenInvite: () => void;
  onOpenAccounts: () => void;
  onOpenBudgets: () => void;
  onOpenHealthCheck?: () => void;
  onOpenScenario?: () => void;
  onOpenPlanComparison?: () => void;
  onOpenAdminAnalytics?: () => void;
  currentSubscription?: Subscription | null;
}

export const SayaView: React.FC<SayaViewProps> = ({
  onOpenInvite,
  onOpenAccounts,
  onOpenBudgets,
  onOpenHealthCheck,
  onOpenScenario,
  onOpenPlanComparison,
  onOpenAdminAnalytics,
  currentSubscription,
}) => {
  const { profile, user, logout, switchDemoUser, isDemoMode } = useAuth();
  const { family, members } = useFamily();
  const { notifications, recurringTransactions, templates } = useFinance();

  // Modal states
  const [showRecurring, setShowRecurring] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportInitialTab, setExportInitialTab] = useState<'csv' | 'pdf' | 'full'>('csv');
  const [showPrivacyCenter, setShowPrivacyCenter] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showBetaInvite, setShowBetaInvite] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showBetaDashboard, setShowBetaDashboard] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5 pb-8">
      {/* 1. PROFIL & KELUARGA */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#144D3A] text-white flex items-center justify-center font-bold text-xl shadow-sm">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[#1F2937] truncate">
            {profile?.full_name || 'Pengguna LEGAKU'}
          </h2>
          <p className="text-xs text-[#6B7280] truncate mt-0.5">{user?.email}</p>
          <span className="inline-block text-[10px] font-semibold text-[#144D3A] bg-[#E8F2EC] px-2.5 py-0.5 rounded-full mt-1.5">
            Keluarga {family?.name}
          </span>
        </div>
      </div>

      {/* Family Hub Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <Users className="w-4 h-4 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Keluarga ({family?.name})</h3>
          </div>
          <button
            onClick={onOpenInvite}
            className="text-xs font-semibold text-[#144D3A] hover:text-[#2E7D61] flex items-center gap-1 cursor-pointer bg-[#E8F2EC] px-3 py-1.5 rounded-xl transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Undang
          </button>
        </div>

        {/* Member list */}
        <div className="space-y-2.5 divide-y divide-[#E5E7EB]">
          {members.map((m) => (
            <div key={m.id} className="pt-2.5 first:pt-0 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center text-xs font-semibold">
                  {m.profile?.full_name?.charAt(0) || 'M'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1F2937] leading-none">
                    {m.profile?.full_name || 'Anggota'}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-1 leading-none">
                    {m.role === 'owner' ? 'Kepala Keluarga / Pengelola' : 'Pasangan'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F9FAF7] text-[#144D3A] border border-[#E5E7EB]">
                {m.role}
              </span>
            </div>
          ))}
        </div>

        {/* Invite Code Quick Banner */}
        <div className="bg-[#E8F2EC] rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-[#6B7280] block uppercase tracking-wider font-semibold">
              Kode Undangan Keluarga
            </span>
            <span className="font-mono font-bold text-[#144D3A] text-sm">{family?.invite_code}</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onOpenInvite} className="cursor-pointer text-xs py-1">
            Salin Kode
          </Button>
        </div>
      </div>

      {/* 2. PAKET & LANGGANAN */}
      <div className="bg-[#144D3A] text-white rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D6C6AC]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Paket Langganan
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
            {currentSubscription?.plan?.name || 'Free Plan'}
          </span>
        </div>
        <p className="text-xs text-white/80 leading-relaxed mb-4">
          {currentSubscription?.plan?.slug === 'founder_lifetime'
            ? 'Akses eksklusif seumur hidup aktif untuk seluruh fitur premium keluarga Anda.'
            : currentSubscription?.plan?.slug === 'family'
            ? 'Akses penuh seluruh fitur AI, scan nota, dan multi-user untuk seluruh anggota keluarga.'
            : currentSubscription?.plan?.slug === 'plus'
            ? 'Akses ditingkatkan: 150 chat AI, 50 nota, Simulator Skenario, dan Cek Kesehatan.'
            : 'Nikmati kuota dasar AI dan pencatatan keuangan gratis selamanya.'}
        </p>
        <button
          type="button"
          onClick={onOpenPlanComparison}
          className="w-full py-2.5 rounded-xl bg-white text-[#144D3A] font-bold text-xs hover:bg-[#E8F2EC] transition-colors shadow-sm cursor-pointer"
        >
          {currentSubscription?.plan?.slug === 'founder_lifetime'
            ? 'Lihat Detail Paket Founder'
            : 'Bandingkan & Upgrade Paket'}
        </button>
      </div>

      {/* 3. KEUANGAN RUTIN (Recurring & Templates) */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-2">
          Keuangan Rutin & Otomasi
        </h4>
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
          <button
            onClick={() => setShowRecurring(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1F2937]">Transaksi Berulang</p>
                  <span className="text-[10px] bg-[#E8F2EC] text-[#144D3A] font-bold px-2 py-0.5 rounded-full">
                    {recurringTransactions.length} jadwal
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">Kelola tagihan internet, listrik, gaji, dan cicilan</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => setShowTemplates(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1F2937]">Template Catat Cepat</p>
                  <span className="text-[10px] bg-[#E8F2EC] text-[#144D3A] font-bold px-2 py-0.5 rounded-full">
                    {templates.length} template
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">Atur pintasan pencatatan makan, bensin, dan belanja</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* 3. REKENING & ANGGARAN */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-2">
          Rekening & Anggaran
        </h4>
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
          <button
            onClick={onOpenAccounts}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Kelola Rekening & Dompet</p>
                <p className="text-xs text-[#6B7280]">Tambah akun bank, e-wallet, atau kas tunai</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={onOpenBudgets}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Atur Anggaran Bulanan</p>
                <p className="text-xs text-[#6B7280]">Sesuaikan batas belanja per pos pengeluaran</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* 4. NOTIFIKASI & AKTIVITAS */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-2">
          Pusat Notifikasi & Transparansi
        </h4>
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
          <button
            onClick={() => setShowNotifCenter(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1F2937]">Pusat Notifikasi</p>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#EF4444] text-white font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B7280]">Pemberitahuan jatuh tempo dan batas anggaran</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => setShowNotifPrefs(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Pengaturan Notifikasi</p>
                <p className="text-xs text-[#6B7280]">Pilih pemberitahuan yang ingin diterima keluarga</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => setShowActivity(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <History className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Aktivitas Finansial Keluarga</p>
                <p className="text-xs text-[#6B7280]">Riwayat pencatatan dan perubahan bersama</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* 5. DATA & LAPORAN */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-2">
          Data & Laporan
        </h4>
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
          <button
            onClick={() => setShowCsvImport(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Import Data Transaksi (CSV)</p>
                <p className="text-xs text-[#6B7280]">Pindahkan catatan dari Excel atau aplikasi lain</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => {
              setExportInitialTab('csv');
              setShowExportModal(true);
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Ekspor Transaksi (CSV)</p>
                <p className="text-xs text-[#6B7280]">Unduh arsip spreadsheet lengkap keuangan keluarga</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            onClick={() => {
              setExportInitialTab('pdf');
              setShowExportModal(true);
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Laporan Bulanan Siap Cetak (PDF)</p>
                <p className="text-xs text-[#6B7280]">Ringkasan eksekutif bulanan untuk arsip keluarga</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* 6. KESEHATAN FINANSIAL & SIMULASI */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-2">
          Kecerdasan & Simulasi
        </h4>
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
          <button
            type="button"
            onClick={onOpenHealthCheck}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Cek Kesehatan Finansial</p>
                <p className="text-xs text-[#6B7280]">Evaluasi rasio tabungan, dana darurat & beban utang</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={onOpenScenario}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Simulator Skenario Impian</p>
                <p className="text-xs text-[#6B7280]">Simulasikan percepatan target tabungan keluarga</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* 7. AKUN, KEAMANAN & PRIVASI */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider px-2">
          Akun & Keamanan
        </h4>
        <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm divide-y divide-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setShowPrivacyCenter(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Keamanan & Privasi</p>
                <p className="text-xs text-[#6B7280]">Isolasi data keluarga, enkripsi & kontrol privasi AI</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => setShowBetaInvite(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1F2937]">Akses Undangan Beta</p>
                  <span className="text-[10px] bg-[#E8F2EC] text-[#144D3A] font-bold px-2 py-0.5 rounded-full">
                    Beta Tester
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">Kelola dan bagikan token perintis LEGAKU</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Kirim Masukan & Cerita</p>
                <p className="text-xs text-[#6B7280]">Laporkan kendala, usulan fitur, atau pengalaman Anda</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => setShowHelpCenter(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#E8F2EC]/40 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Pusat Bantuan (FAQ)</p>
                <p className="text-xs text-[#6B7280]">Jawaban seputar AI, keamanan, dan pemasangan aplikasi</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteAccount(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#EF4444]/10 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#EF4444]">Hapus Akun Permanen</p>
                <p className="text-xs text-[#6B7280]">Pembersihan berjenjang profil dan seluruh data personal</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* 8. BANTUAN & TENTANG LEGAKU */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo variant="full" size="md" />
          <p className="text-xs text-[#6B7280] max-w-sm mt-2 leading-relaxed">
            Teman keluarga untuk memahami uang, merencanakan masa depan, dan mengambil keputusan finansial dengan lebih tenang.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
          <button
            type="button"
            onClick={() => setShowBetaDashboard(true)}
            className="hover:text-[#144D3A] transition-colors text-left cursor-pointer flex items-center gap-1.5"
            title="Klik untuk buka Beta Health & Telemetri AFF"
          >
            <Activity className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Versi Aplikasi: Phase 5 (Production & Beta Ready)</span>
          </button>
          <span className="font-semibold text-[#144D3A] bg-[#E8F2EC] px-2 py-0.5 rounded-full">PWA Ready</span>
        </div>
      </div>

      {/* Logout Button */}
      <Button
        type="button"
        variant="outline"
        onClick={logout}
        className="w-full rounded-2xl text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10 text-xs py-3.5 flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Keluar dari Akun
      </Button>

      {/* MODAL DIALOGS */}
      {/* 1. Recurring View Modal */}
      {showRecurring && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] w-full max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto p-5 relative shadow-elevated">
            <button
              onClick={() => setShowRecurring(false)}
              className="absolute top-4 right-4 text-warm-muted hover:text-forest-950 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
            <RecurringView />
          </div>
        </div>
      )}

      {/* 2. Templates Modal */}
      <TemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} />

      {/* 3. Notification Center Modal */}
      <NotificationCenterModal isOpen={showNotifCenter} onClose={() => setShowNotifCenter(false)} />

      {/* 4. Notification Preferences Modal */}
      <NotificationPreferencesModal isOpen={showNotifPrefs} onClose={() => setShowNotifPrefs(false)} />

      {/* 5. Family Activity Modal */}
      {showActivity && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] w-full max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto p-5 relative shadow-elevated">
            <button
              onClick={() => setShowActivity(false)}
              className="absolute top-4 right-4 text-warm-muted hover:text-forest-950 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
            <FamilyActivityTimeline />
          </div>
        </div>
      )}

      {/* 6. CSV Import Modal */}
      <CsvImportModal isOpen={showCsvImport} onClose={() => setShowCsvImport(false)} />

      {/* 7. Export & PDF Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        initialTab={exportInitialTab}
        onClose={() => setShowExportModal(false)}
      />

      {/* 8. Privacy Center Modal */}
      <PrivacyCenterModal
        isOpen={showPrivacyCenter}
        onClose={() => setShowPrivacyCenter(false)}
        onOpenExport={() => {
          setShowPrivacyCenter(false);
          setExportInitialTab('full');
          setShowExportModal(true);
        }}
        onOpenDeleteAccount={() => {
          setShowPrivacyCenter(false);
          setShowDeleteAccount(true);
        }}
      />

      {/* 9. Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      {/* 10. Help Center (FAQ) Modal */}
      <HelpCenterModal
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
      />

      {/* 11. Beta Invite Modal */}
      <BetaInviteModal
        isOpen={showBetaInvite}
        onClose={() => setShowBetaInvite(false)}
      />

      {/* 12. Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />

      {/* 13. Beta Health Dashboard Modal */}
      <BetaHealthDashboard
        isOpen={showBetaDashboard}
        onClose={() => setShowBetaDashboard(false)}
      />
    </div>
  );
};
