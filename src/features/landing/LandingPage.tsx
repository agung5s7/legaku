import React, { useState } from 'react';
import { Logo, LeafMark } from '../../components/ui/Logo';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Mic,
  Users,
  HeartPulse,
  Target,
  Lock,
  CheckCircle2,
  HelpCircle,
  Play,
  FileSpreadsheet,
} from 'lucide-react';

interface LandingPageProps {
  onStartSignup: () => void;
  onStartLogin: () => void;
  onBackToWelcome?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSignup,
  onStartLogin,
  onBackToWelcome,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apakah pasangan harus memakai akun yang sama?',
      a: 'Tidak perlu. Anda dan pasangan masing-masing memiliki akun pribadi dengan password sendiri, lalu bergabung ke dalam Ruang Keluarga yang sama melalui kode undangan.',
    },
    {
      q: 'Apakah LEGAKU AI dapat mengambil uang atau memindahkan saldo otomatis?',
      a: 'Sama sekali tidak. LEGAKU AI hanya berperan sebagai analis dan pembimbing keuangan keluarga. Seluruh transaksi wajib dikonfirmasi langsung oleh Anda (Human-in-the-Loop).',
    },
    {
      q: 'Bagaimana privasi dan keamanan data finansial keluarga dijaga?',
      a: 'Data keuangan Anda diisolasi per keluarga menggunakan Row Level Security (RLS) dan enkripsi standar industri. Kami tidak menjual data pengguna ke pihak ketiga atau pengiklan.',
    },
    {
      q: 'Apakah saya bisa mencoba dulu sebelum mendaftar?',
      a: 'Saat ini fitur demo sedang dinonaktifkan untuk pembaruan. Silakan mendaftar secara gratis untuk menikmati fitur LEGAKU sepenuhnya.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7] text-[#1F2937] font-sans selection:bg-[#E8F2EC] selection:text-[#144D3A]">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#F9FAF7]/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div
            onClick={onBackToWelcome}
            className="cursor-pointer transition-opacity hover:opacity-90 shrink-0"
            title="Kembali ke Layar Pembuka"
          >
            {/* Mobile: Compact logo without multi-line tagline */}
            <div className="sm:hidden">
              <Logo variant="horizontal" size="sm" showTagline={false} />
            </div>
            {/* Desktop: Full horizontal logo with tagline */}
            <div className="hidden sm:block">
              <Logo variant="horizontal" size="md" showTagline={true} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {onBackToWelcome && (
              <button
                onClick={onBackToWelcome}
                className="hidden md:inline-flex text-xs font-semibold text-[#6B7280] hover:text-[#144D3A] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ← Layar Pembuka
              </button>
            )}
            <button
              onClick={onStartLogin}
              className="text-xs font-semibold text-[#1F2937] hover:text-[#144D3A] px-2 sm:px-3 py-1.5 sm:py-2 transition-colors cursor-pointer active:scale-95 rounded-xl"
              title="Masuk ke akun Anda"
            >
              Masuk
            </button>
            <button
              onClick={onStartSignup}
              className="text-xs font-semibold bg-[#144D3A] hover:bg-[#0E372A] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
              title="Daftar akun keluarga baru"
            >
              <span className="sm:hidden">Daftar</span>
              <span className="hidden sm:inline">Mulai Sekarang</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-12 pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-[#E8F2EC] text-[#144D3A] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
          <LeafMark size={16} />
          <span>Family Finance & AI Companion</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#144D3A] tracking-tight leading-tight">
          Atur uang. Hidup lebih lega.
        </h1>

        <p className="text-sm sm:text-base text-[#6B7280] max-w-2xl mx-auto leading-relaxed font-normal">
          Teman keluarga untuk memahami uang, merencanakan masa depan, dan mengambil keputusan finansial bersama dengan lebih tenang.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={onStartSignup}
            className="w-full sm:w-auto bg-[#144D3A] hover:bg-[#0E372A] text-white font-bold text-sm px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            Mulai Sekarang — Gratis
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Visual Preview Mockup */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-md text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#144D3A] text-white flex items-center justify-center font-bold">
                  KB
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Ruang Keluarga Bahagia</h3>
                  <p className="text-xs text-[#6B7280]">2 Anggota Aktif • Realtime Sync</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#144D3A] bg-[#E8F2EC] px-3 py-1 rounded-full">
                Sehat & Terencana
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#144D3A] text-white p-4 rounded-2xl">
                <span className="text-[11px] text-[#D6C6AC] block font-semibold">Total Saldo Keluarga</span>
                <span className="text-lg font-bold block mt-1">Rp48.500.000</span>
                <span className="text-[10px] text-emerald-200 mt-0.5 block">+Rp4.200.000 bulan ini</span>
              </div>
              <div className="bg-[#F9FAF7] border border-[#E5E7EB] p-4 rounded-2xl">
                <span className="text-[11px] text-[#6B7280] block font-semibold">Target Dana Darurat</span>
                <span className="text-lg font-bold text-[#1F2937] block mt-1">82%</span>
                <span className="text-[10px] text-[#2E7D61] mt-0.5 block">Rp24,6jt dari Rp30jt</span>
              </div>
              <div className="bg-[#E8F2EC] border border-[#d5e7dc] p-4 rounded-2xl">
                <span className="text-[11px] text-[#144D3A] block font-semibold">LEGAKU AI Insight</span>
                <p className="text-xs text-[#144D3A] font-medium mt-1 leading-snug">
                  "Belanja dapur bulan ini hemat 12%. Keluarga siap menambah tabungan liburan."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MASALAH & SOLUSI */}
      <section className="py-16 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#144D3A]">
              Mengapa Keuangan Keluarga Sering Melelahkan?
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              Kebanyakan pasangan terjebak dalam spreadsheet kaku atau saling menduga tanpa gambaran yang jernih.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F9FAF7] border border-[#E5E7EB] rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="text-sm font-bold text-[#1F2937]">Spreadsheet yang Kaku & Rumit</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Terlalu banyak rumus dan kolom yang membuat malas mencatat setelah seharian lelah bekerja.
              </p>
            </div>

            <div className="bg-[#F9FAF7] border border-[#E5E7EB] rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="text-sm font-bold text-[#1F2937]">Diskusi yang Memicu Beban Emosi</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Membahas uang kerap berujung rasa cemas atau saling menyalahkan karena tidak ada pihak penengah objektif.
              </p>
            </div>

            <div className="bg-[#E8F2EC] border border-[#d5e7dc] rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#144D3A] text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="text-sm font-bold text-[#144D3A]">Pendekatan Tenang LEGAKU</h3>
              <p className="text-xs text-[#1F2937] leading-relaxed">
                Membawa keterbukaan yang hangat, otomatisasi foto struk & suara, serta pendamping AI yang membimbing tanpa menghakimi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FITUR UTAMA */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-[#2E7D61] uppercase tracking-wider">
            Fitur Cerdas Keluarga
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#144D3A]">
            Segala Hal yang Dibutuhkan untuk Hidup Lebih Tenang
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* Fitur 1: Catat Cepat, Struk & Suara */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <Receipt className="w-5 h-5 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Catat Cepat, Struk AI & Suara</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Cukup foto struk belanjaan atau ucapkan "Makan siang 45 ribu pakai BCA", AI menyusun draf transaksi untuk Anda konfirmasi.
            </p>
          </div>

          {/* Fitur 2: LEGAKU AI Companion */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <Sparkles className="w-5 h-5 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">LEGAKU AI Companion</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Tanyakan apa saja tentang tren keuangan keluarga Anda, saran alokasi dana darurat, hingga review bulanan yang menyejukkan.
            </p>
          </div>

          {/* Fitur 3: Cek Kesehatan Finansial */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <HeartPulse className="w-5 h-5 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Financial Health Check</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Evaluasi komprehensif rasio tabungan, ketahanan dana darurat, dan proporsi kebutuhan pokok keluarga dalam satu klik.
            </p>
          </div>

          {/* Fitur 4: Impian Bersama (Goals) */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <Target className="w-5 h-5 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Target Impian Bersama</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Wujudkan rencana renovasi rumah, pendidikan anak, atau liburan keluarga dengan visual progres yang memotivasi bersama pasangan.
            </p>
          </div>

          {/* Fitur 5: Kolaborasi Dua Arah Pasangan */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <Users className="w-5 h-5 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Kolaborasi Pasangan Realtime</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Saat pasangan mencatat belanjaan di minimarket, saldo bersama langsung tersinkronisasi otomatis di ponsel Anda.
            </p>
          </div>

          {/* Fitur 6: Privasi Terkunci Kriptografis */}
          <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center text-[#144D3A]">
              <Lock className="w-5 h-5 text-[#144D3A]" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2937]">Privasi Mutlak & Hak Data</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Data hanya dapat diakses oleh anggota keluarga Anda. Anda memiliki hak penuh untuk ekspor berkas CSV lengkap atau hapus akun kapan saja.
            </p>
          </div>
        </div>
      </section>

      {/* 5. STRUKTUR PAKET (PRICING ARCHITECTURE) */}
      <section className="py-16 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#2E7D61] uppercase tracking-wider">
              Transparan & Terjangkau
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#144D3A]">
              Pilih Ruang Kenyamanan Keluarga Anda
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              Mulai gratis selamanya, tingkatkan kapan saja sesuai kebutuhan pertumbuhan keluarga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free */}
            <div className="bg-[#F9FAF7] border border-[#E5E7EB] rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#1F2937]">LEGAKU Free</h3>
                <p className="text-xs text-[#6B7280]">Esensial untuk pencatatan harian dasar keluarga.</p>
                <div className="text-2xl font-extrabold text-[#144D3A] pt-2">Rp0</div>
                <ul className="pt-3 space-y-2 text-xs text-[#6B7280]">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Pencatatan manual tanpa batas</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Kelola rekening bersama</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> 15x tanya LEGAKU AI / bln</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> 5x scan foto struk / bln</li>
                </ul>
              </div>
              <button
                onClick={onStartSignup}
                className="w-full py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#E8F2EC] text-[#144D3A] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Mulai Gratis
              </button>
            </div>

            {/* Plus (Popular) */}
            <div className="bg-white border-2 border-[#144D3A] rounded-3xl p-6 space-y-4 relative shadow-md flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#144D3A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                PALING DISUKAI
              </span>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#144D3A]">LEGAKU Plus</h3>
                <p className="text-xs text-[#6B7280]">Kecerdasan finansial lanjutan untuk kenyamanan.</p>
                <div className="text-2xl font-extrabold text-[#144D3A] pt-2">
                  Rp39.000 <span className="text-xs font-normal text-[#6B7280]">/ bulan</span>
                </div>
                <ul className="pt-3 space-y-2 text-xs text-[#1F2937]">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Tanya LEGAKU AI tanpa batas</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> 60x scan foto struk / bln</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Input suara tanpa batas</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Financial Health Check</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Simulator Skenario Impian</li>
                </ul>
              </div>
              <button
                onClick={onStartSignup}
                className="w-full py-2.5 bg-[#144D3A] hover:bg-[#0E372A] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                Pilih LEGAKU Plus
              </button>
            </div>

            {/* Family */}
            <div className="bg-[#F9FAF7] border border-[#E5E7EB] rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#1F2937]">LEGAKU Family</h3>
                <p className="text-xs text-[#6B7280]">Kolaborasi multi-anggota tanpa batas.</p>
                <div className="text-2xl font-extrabold text-[#144D3A] pt-2">
                  Rp69.000 <span className="text-xs font-normal text-[#6B7280]">/ bulan</span>
                </div>
                <ul className="pt-3 space-y-2 text-xs text-[#6B7280]">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Hingga 5 anggota keluarga</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> 150x scan foto struk / bln</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Tanya AI & Suara tanpa batas</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D61]" /> Ekspor Laporan PDF & CSV lengkap</li>
                </ul>
              </div>
              <button
                onClick={onStartSignup}
                className="w-full py-2.5 bg-white border border-[#E5E7EB] hover:bg-[#E8F2EC] text-[#144D3A] font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Pilih Family
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ RINGKAS */}
      <section className="py-16 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#144D3A]">Pertanyaan Umum (FAQ)</h2>
          <p className="text-xs text-[#6B7280]">Hal yang sering ditanyakan oleh keluarga perintis.</p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-[#1F2937] hover:bg-[#F9FAF7] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-sm text-[#144D3A] font-bold ml-2">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#6B7280] leading-relaxed border-t border-[#E5E7EB]/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-16 bg-[#144D3A] text-white text-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F2EC] mx-auto flex items-center justify-center">
            <LeafMark size={28} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Mulai Hidup Finansial yang Lebih Tenang Hari Ini.
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto leading-relaxed">
            Bergabunglah bersama keluarga perintis lainnya dan rasakan ringannya mengatur uang bersama pasangan.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStartSignup}
              className="w-full sm:w-auto bg-[#D6C6AC] hover:bg-[#c9b79c] text-[#144D3A] font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md transition-colors cursor-pointer"
            >
              Mulai Sekarang — Gratis
            </button>
            <button
              onClick={onStartLogin}
              className="w-full sm:w-auto bg-transparent border border-emerald-400/40 hover:bg-emerald-900/40 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-colors cursor-pointer"
            >
              Sudah punya akun? Masuk
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 bg-[#0E372A] text-white/60 text-xs text-center border-t border-emerald-950">
        <p>© 2026 LEGAKU. Atur uang. Hidup lebih lega.</p>
      </footer>
    </div>
  );
};
