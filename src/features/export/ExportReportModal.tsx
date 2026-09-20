import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useFinance } from '../../context/FinanceContext';
import { useFamily } from '../../context/FamilyContext';
import { formatRupiah } from '../../utils/formatters';
import {
  Download,
  FileSpreadsheet,
  Printer,
  Archive,
  Bot,
  ShieldCheck,
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'csv' | 'pdf' | 'full';
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'csv',
}) => {
  const {
    transactions,
    accounts,
    goals,
    budgets,
    recurringTransactions,
    templates,
  } = useFinance();
  const { family } = useFamily();

  const [activeTab, setActiveTab] = useState<'csv' | 'pdf' | 'full'>(initialTab);
  const [dateFilter, setDateFilter] = useState<'this_month' | 'three_months' | 'year' | 'all'>('this_month');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');

  // Month and Year for Monthly Report
  const now = new Date();
  const [reportMonth, setReportMonth] = useState<number>(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(now.getFullYear());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Filter transactions for CSV Export
  const exportTxs = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      if (selectedAccountId !== 'all' && tx.account_id !== selectedAccountId) return false;

      const txDate = new Date(tx.transaction_date);
      if (dateFilter === 'this_month') {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (dateFilter === 'three_months') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 90;
      } else if (dateFilter === 'year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, selectedType, selectedAccountId, dateFilter, now]);

  // Generate and download standard Transactions CSV
  const handleDownloadCsv = () => {
    const headers = ['Tanggal', 'Tipe', 'Nominal', 'Kategori', 'Rekening', 'Keterangan', 'Catatan', 'Dicatat Oleh'];
    const rows = exportTxs.map((tx) => [
      tx.transaction_date,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      tx.amount,
      `"${(tx.category_name || '').replace(/"/g, '""')}"`,
      `"${(tx.account_name || '').replace(/"/g, '""')}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
      `"${(tx.creator_name || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legaku-transaksi-${family?.name ? family.name.toLowerCase().replace(/\s+/g, '-') : 'keluarga'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate and download Comprehensive Full Family Archive CSV
  const handleDownloadFullArchive = () => {
    const familyName = family?.name || 'Keluarga';
    const lines: string[] = [];

    // Header metadata
    lines.push(`### ARSIP LENGKAP KEUANGAN KELUARGA — LEGAKU ###`);
    lines.push(`Nama Keluarga: "${familyName.replace(/"/g, '""')}"`);
    lines.push(`Tanggal Ekspor: ${new Date().toISOString()}`);
    lines.push(`Jaminan: Data 100% terisolasi milik ruang keluarga`);
    lines.push(``);

    // 1. REKENING & DOMPET
    lines.push(`[BAGIAN 1: REKENING & DOMPET]`);
    lines.push(`Nama Rekening,Tipe,Saldo Saat Ini,Mata Uang`);
    accounts.forEach((acc) => {
      lines.push(`"${acc.name.replace(/"/g, '""')}",${acc.type},${acc.current_balance},IDR`);
    });
    lines.push(``);

    // 2. TARGET IMPIAN (GOALS)
    lines.push(`[BAGIAN 2: TARGET IMPIAN BERSAMA]`);
    lines.push(`Nama Impian,Target Nominal,Terkumpul,Target Tanggal`);
    goals.forEach((g) => {
      lines.push(`"${g.name.replace(/"/g, '""')}",${g.target_amount},${g.current_amount},${g.target_date || '-'}`);
    });
    lines.push(``);

    // 3. ANGGARAN BULANAN (BUDGETS)
    lines.push(`[BAGIAN 3: ANGGARAN BULANAN]`);
    lines.push(`Kategori,Batas Anggaran,Bulan,Tahun`);
    budgets.forEach((b) => {
      lines.push(`"${(b.category_name || b.category_id).replace(/"/g, '""')}",${b.amount},${b.month},${b.year}`);
    });
    lines.push(``);

    // 4. TRANSAKSI BERULANG (RECURRING)
    lines.push(`[BAGIAN 4: TRANSAKSI BERULANG]`);
    lines.push(`Keterangan,Nominal,Frekuensi,Tipe,Status`);
    recurringTransactions.forEach((r) => {
      lines.push(`"${r.description.replace(/"/g, '""')}",${r.amount},${r.frequency},${r.type},${r.is_active ? 'Aktif' : 'Nonaktif'}`);
    });
    lines.push(``);

    // 5. TEMPLATE CATAT CEPAT
    lines.push(`[BAGIAN 5: TEMPLATE CATAT CEPAT]`);
    lines.push(`Nama Template,Keterangan,Nominal Default`);
    templates.forEach((t) => {
      lines.push(`"${t.name.replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}",${t.default_amount || 0}`);
    });
    lines.push(``);

    // 6. RIWAYAT SELURUH TRANSAKSI
    lines.push(`[BAGIAN 6: RIWAYAT TRANSAKSI LENGKAP]`);
    lines.push(`ID,Tanggal,Tipe,Nominal,Kategori,Rekening,Keterangan,Catatan,Dicatat Oleh`);
    transactions.forEach((tx) => {
      lines.push([
        tx.id,
        tx.transaction_date,
        tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        tx.amount,
        `"${(tx.category_name || '').replace(/"/g, '""')}"`,
        `"${(tx.account_name || '').replace(/"/g, '""')}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
        `"${(tx.creator_name || '').replace(/"/g, '""')}"`,
      ].join(','));
    });

    const fullCsv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legaku-arsip-lengkap-${familyName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Monthly Report Calculations
  const reportData = useMemo(() => {
    const monthTxs = transactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear;
    });

    const income = monthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = monthTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

    // Top categories
    const catMap: { [catId: string]: { name: string; amount: number } } = {};
    for (const tx of monthTxs.filter((t) => t.type === 'expense')) {
      if (!catMap[tx.category_id]) {
        catMap[tx.category_id] = { name: tx.category_name || 'Lainnya', amount: 0 };
      }
      catMap[tx.category_id].amount += Number(tx.amount);
    }
    const topCategories = Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      income,
      expense,
      net,
      savingsRate,
      topCategories,
      txCount: monthTxs.length,
    };
  }, [transactions, reportMonth, reportYear]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Laporan & Ekspor Data"
      subtitle="Unduh arsip lengkap finansial keluarga atau cetak ringkasan bulanan."
    >
      <div className="space-y-4 font-sans">
        {/* Tab Switcher */}
        <div className="flex bg-[#E8F2EC] p-1 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Filter CSV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('full')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'full'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Paket Lengkap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            PDF Bulanan
          </button>
        </div>

        {/* TAB 1: CSV EXPORT */}
        {activeTab === 'csv' && (
          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#6B7280] uppercase tracking-wider block text-[11px]">
                Rentang Waktu
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'this_month' | 'three_months' | 'year' | 'all')}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2 font-medium"
              >
                <option value="this_month">Bulan Ini</option>
                <option value="three_months">3 Bulan Terakhir</option>
                <option value="year">Tahun Berjalan (2026)</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-[#6B7280] uppercase tracking-wider block text-[11px] mb-1">
                  Jenis Transaksi
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'all' | 'expense' | 'income')}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2 font-medium"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="expense">Hanya Pengeluaran</option>
                  <option value="income">Hanya Pemasukan</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#6B7280] uppercase tracking-wider block text-[11px] mb-1">
                  Akun / Rekening
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2 font-medium"
                >
                  <option value="all">Semua Rekening</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Box */}
            <div className="p-3.5 bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Jumlah data yang akan diekspor:</span>
              <span className="font-bold text-[#144D3A]">{exportTxs.length} transaksi</span>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadCsv}
              disabled={exportTxs.length === 0}
              className="w-full h-11 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Unduh Berkas CSV
            </Button>
          </div>
        )}

        {/* TAB 2: PAKET LENGKAP KELUARGA (FULL ARCHIVE) */}
        {activeTab === 'full' && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#E8F2EC]/70 border border-[#E5E7EB] rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#144D3A] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-[#144D3A]">Ekspor Menyeluruh Data Keluarga</h4>
                <p className="text-[#1F2937] leading-relaxed">
                  Unduh seluruh arsip data yang dimiliki <strong>Keluarga {family?.name}</strong> dalam satu berkas terstruktur untuk arsip pribadi atau migrasi mandiri.
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-2">
              <span className="font-semibold text-[#1F2937] block">Cakupan Data yang Diekspor:</span>
              <div className="grid grid-cols-2 gap-2 text-[#6B7280]">
                <p>• {transactions.length} Transaksi Lengkap</p>
                <p>• {accounts.length} Rekening & Dompet</p>
                <p>• {goals.length} Target Impian</p>
                <p>• {budgets.length} Batas Anggaran</p>
                <p>• {recurringTransactions.length} Transaksi Berulang</p>
                <p>• {templates.length} Template Pintasan</p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadFullArchive}
              className="w-full h-11 text-xs font-semibold gap-2 shadow-sm"
            >
              <Archive className="w-4 h-4" />
              Unduh Paket Lengkap Data Keluarga (.CSV)
            </Button>
          </div>
        )}

        {/* TAB 3: MONTHLY REPORT (PRINTABLE) */}
        {activeTab === 'pdf' && (
          <div className="space-y-4">
            {/* Month Selector */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="flex-1 bg-white border border-[#E5E7EB] rounded-xl p-2 font-semibold"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="w-28 bg-white border border-[#E5E7EB] rounded-xl p-2 font-semibold"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Printable Report Document Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-xs space-y-4 text-xs font-sans">
              <div className="border-b border-[#E5E7EB] pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#144D3A] tracking-tight">
                    LAPORAN KEUANGAN KELUARGA
                  </h3>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    {family?.name || 'Keluarga'} • {monthNames[reportMonth - 1]} {reportYear}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#144D3A] tracking-wider">
                    LEGAKU
                  </span>
                  <p className="text-[9px] text-[#6B7280]">Atur uang. Hidup lebih lega.</p>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#F9FAF7] p-2.5 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#6B7280] block">Pemasukan</span>
                  <span className="font-extrabold text-[#144D3A] block mt-0.5">
                    {formatRupiah(reportData.income)}
                  </span>
                </div>
                <div className="bg-[#F9FAF7] p-2.5 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[10px] text-[#6B7280] block">Pengeluaran</span>
                  <span className="font-extrabold text-[#1F2937] block mt-0.5">
                    {formatRupiah(reportData.expense)}
                  </span>
                </div>
                <div className="bg-[#E8F2EC] p-2.5 rounded-xl border border-[#d5e7dc]">
                  <span className="text-[10px] text-[#144D3A] block">Laju Tabungan</span>
                  <span className="font-extrabold text-[#144D3A] block mt-0.5">
                    {reportData.savingsRate}%
                  </span>
                </div>
              </div>

              {/* Top Categories */}
              <div>
                <h4 className="font-bold text-[#144D3A] text-[11px] uppercase tracking-wider mb-2">
                  Pos Pengeluaran Terbesar
                </h4>
                <div className="space-y-1.5 divide-y divide-[#E5E7EB]">
                  {reportData.topCategories.length === 0 ? (
                    <p className="text-[#6B7280] text-[11px]">Belum ada data pengeluaran bulan ini.</p>
                  ) : (
                    reportData.topCategories.map((cat, idx) => (
                      <div key={cat.name} className="pt-1.5 flex items-center justify-between">
                        <span className="text-[#1F2937] font-medium">
                          {idx + 1}. {cat.name}
                        </span>
                        <span className="font-bold text-[#144D3A]">
                          {formatRupiah(cat.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Wisdom Footer Card */}
              <div className="bg-[#E8F2EC]/60 border border-[#E5E7EB] rounded-2xl p-3 flex items-start gap-2 text-[11px] text-[#144D3A]">
                <Bot className="w-4 h-4 text-[#144D3A] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {reportData.savingsRate >= 15
                    ? 'Kondisi finansial bulan ini menunjukkan pola tabungan yang sangat sehat. Pertahankan kebiasaan komunikasi yang tenang.'
                    : 'Pengeluaran bulan ini cukup dinamis. Manfaatkan review bulanan bersama pasangan untuk menyelaraskan prioritas bulan depan.'}
                </p>
              </div>
            </div>

            {/* Print button */}
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              className="w-full h-11 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan sebagai PDF
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
