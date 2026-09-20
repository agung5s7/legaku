import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import {
  ShieldCheck,
  Lock,
  Eye,
  Bot,
  Receipt,
  HardDrive,
  Users,
  Download,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface PrivacyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport?: () => void;
  onOpenDeleteAccount?: () => void;
}

export const PrivacyCenterModal: React.FC<PrivacyCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenExport,
  onOpenDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'keamanan' | 'ai_privacy'>('keamanan');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keamanan & Privasi" size="lg">
      <div className="space-y-5">
        {/* Tab Selector */}
        <div className="flex bg-[#E8F2EC] p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('keamanan')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'keamanan'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privasi & Data Keluarga
          </button>
          <button
            onClick={() => setActiveTab('ai_privacy')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ai_privacy'
                ? 'bg-white text-[#144D3A] shadow-xs'
                : 'text-[#6B7280] hover:text-[#144D3A]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Kontrol Privasi AI
          </button>
        </div>

        {/* TAB 1: KEAMANAN & DATA */}
        {activeTab === 'keamanan' && (
          <div className="space-y-4">
            <div className="bg-[#E8F2EC]/60 border border-[#E5E7EB] rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#144D3A] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#144D3A]">Komitmen Ketenangan LEGAKU</h4>
                <p className="text-xs text-[#1F2937] leading-relaxed">
                  Kami percaya privasi finansial adalah hak fundamental keluarga. Data Anda tidak pernah dijual kepada pihak ketiga, pengiklan, atau lembaga pinjaman.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* 1. Data Keluarga */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#144D3A] font-bold">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F2EC] flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-[#144D3A]" />
                  </div>
                  <span>1. Data Keluarga</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Setiap ruang keluarga terisolasi secara kriptografis menggunakan Supabase Row Level Security (RLS). Hanya anggota resmi yang Anda undang yang dapat melihat data.
                </p>
              </div>

              {/* 2. Data Transaksi */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#144D3A] font-bold">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F2EC] flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-[#144D3A]" />
                  </div>
                  <span>2. Transaksi & Saldo</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Setiap catatan nominal transaksi, saldo rekening, dan riwayat transfer dienkripsi dalam penyimpanan database awan yang mematuhi standar industri global.
                </p>
              </div>

              {/* 3. Struk / Bukti Belanja */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#144D3A] font-bold">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F2EC] flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5 text-[#144D3A]" />
                  </div>
                  <span>3. Foto Struk Belanja</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Foto struk hanya digunakan sementara untuk mengekstrak nominal, toko, dan tanggal ke formulir pencatatan, dan dapat Anda hapus kapan saja dari riwayat.
                </p>
              </div>

              {/* 4. Penyimpanan Terisolasi */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#144D3A] font-bold">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F2EC] flex items-center justify-center">
                    <HardDrive className="w-3.5 h-3.5 text-[#144D3A]" />
                  </div>
                  <span>4. Storage & Infrastruktur</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Berkas disimpan dalam bucket terlindungi dengan kebijakan akses berbasis peran (owner & partner). Tidak ada URL publik terbuka tanpa otentikasi.
                </p>
              </div>

              {/* 5. Otentikasi & Sesi */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#144D3A] font-bold">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F2EC] flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5 text-[#144D3A]" />
                  </div>
                  <span>5. Otentikasi Terenkripsi</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Kata sandi di-hash menggunakan algoritma kriptografi modern. Token sesi tersimpan aman dan kedaluwarsa secara berkala untuk melindungi akun Anda.
                </p>
              </div>

              {/* 6. Hak Milik Data */}
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[#144D3A] font-bold">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F2EC] flex items-center justify-center">
                    <Download className="w-3.5 h-3.5 text-[#144D3A]" />
                  </div>
                  <span>6. Hak Ekspor & Hapus</span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Data adalah milik Anda sepenuhnya. Anda dapat mengekspor seluruh catatan ke format spreadsheet atau meminta penghapusan akun permanen kapan saja.
                </p>
              </div>
            </div>

            {/* Aksi Cepat Ekspor & Hapus */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {onOpenExport && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-[#E8F2EC] hover:bg-[#d5e7dc] text-[#144D3A] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Arsip Data Keluarga
                </button>
              )}
              {onOpenDeleteAccount && (
                <button
                  type="button"
                  onClick={onOpenDeleteAccount}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Pengaturan Penghapusan Akun
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: KONTROL PRIVASI AI */}
        {activeTab === 'ai_privacy' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#144D3A] font-bold text-xs">
                <div className="w-7 h-7 rounded-xl bg-[#E8F2EC] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#144D3A]" />
                </div>
                <span>Prinsip Human-in-the-Loop LEGAKU AI</span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                LEGAKU AI dirancang sebagai pendamping yang membimbing, bukan pengganti kendali Anda. AI tidak pernah melakukan tindakan finansial sepihak tanpa persetujuan Anda.
              </p>

              <div className="bg-[#F9FAF7] border border-[#E5E7EB] rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-[#144D3A]">
                <span>AI Menghasilkan Draf</span>
                <span>→</span>
                <span>Tinjauan (Preview)</span>
                <span>→</span>
                <span>Konfirmasi Anda</span>
                <span>→</span>
                <span className="text-[#2E7D61]">Tersimpan Aman</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-[#1F2937]">Bagaimana Data Diproses:</h5>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D61] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1F2937]">Kapan AI memproses data?</span>
                    <p className="text-[#6B7280] mt-0.5">
                      Hanya saat Anda secara sadar menekan tombol kirim pesan, memotret struk, atau berbicara melalui fitur input suara.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-[#E5E7EB]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D61] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1F2937]">Data apa yang digunakan?</span>
                    <p className="text-[#6B7280] mt-0.5">
                      Agregasi ringkasan kategori belanja bulan berjalan dan pertanyaan Anda guna memberikan saran finansial yang relevan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-[#E5E7EB]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D61] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1F2937]">Data apa yang TIDAK pernah diberikan ke AI?</span>
                    <p className="text-[#6B7280] mt-0.5">
                      Nomor kartu debit/kredit, kredensial bank, nomor kontak pribadi, dan identitas rahasia perbankan Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-[#E5E7EB]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D61] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1F2937]">Apakah percakapan melatih model publik?</span>
                    <p className="text-[#6B7280] mt-0.5">
                      Tidak. API perusahaan yang digunakan melarang penggunaan data percakapan pengguna untuk pelatihan model kecerdasan buatan publik.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
