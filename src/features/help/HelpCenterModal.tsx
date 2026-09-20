import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles, Smartphone, Users } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'dasar' | 'keamanan' | 'ai' | 'kolaborasi';
}

const FAQS: FAQItem[] = [
  {
    category: 'dasar',
    question: 'Apa itu LEGAKU?',
    answer:
      'LEGAKU adalah Teman Keluarga & AI Companion finansial yang dirancang untuk membantu pasangan dan keluarga memahami uang, merencanakan masa depan, dan mengambil keputusan finansial bersama dengan lebih tenang. LEGAKU bukan aplikasi trading, perbankan rumit, atau pengganti spreadsheet kaku.',
  },
  {
    category: 'keamanan',
    question: 'Apakah data saya aman dan privat?',
    answer:
      'Sangat aman. LEGAKU menggunakan enkripsi berstandar industri dan Supabase Row Level Security (RLS). Catatan keuangan keluarga Anda diisolasi secara ketat sehingga tidak dapat diakses oleh keluarga lain atau dijual kepada pihak ketiga.',
  },
  {
    category: 'kolaborasi',
    question: 'Apakah pasangan bisa menggunakan akun yang sama atau akun masing-masing?',
    answer:
      'Setiap pasangan memiliki akun dan kata sandi masing-masing demi kenyamanan privasi. Pasangan kemudian disatukan ke dalam satu Ruang Keluarga Bersama sehingga pencatatan, anggaran, dan target impian dapat dipantau bersama secara realtime.',
  },
  {
    category: 'kolaborasi',
    question: 'Bagaimana cara mengundang pasangan?',
    answer:
      'Buka tab "Saya" atau tekan tombol "Undang" di header keluarga. Anda akan mendapatkan kode unik keluarga berformat 8 digit. Bagikan kode tersebut kepada pasangan untuk dimasukkan saat pendaftaran.',
  },
  {
    category: 'ai',
    question: 'Bagaimana LEGAKU AI bekerja?',
    answer:
      'LEGAKU AI bertindak sebagai analis keuangan keluarga pribadi yang ramah dan objektif. AI membaca agregasi pengeluaran dan pemasukan bulan berjalan Anda untuk menjawab pertanyaan, mendeteksi pola kebocoran pos belanja, dan memberikan rekomendasi tanpa nada menghakimi.',
  },
  {
    category: 'ai',
    question: 'Apakah AI dapat mengubah atau menghapus transaksi saya secara otomatis?',
    answer:
      'Tidak pernah. LEGAKU mematuhi prinsip mutlak Human-in-the-Loop: AI hanya menyiapkan draf atau pratinjau (Preview). Setiap pencatatan atau perubahan harus dikonfirmasi langsung oleh Anda sebelum disimpan ke rekening.',
  },
  {
    category: 'ai',
    question: 'Bagaimana fitur Scan Struk AI bekerja?',
    answer:
      'Cukup foto atau unggah gambar struk belanja fisik Anda. Sistem kecerdasan visual akan mengekstrak total nominal, nama toko/merchant, tanggal, dan menyarankan kategori belanja secara otomatis ke dalam formulir konfirmasi.',
  },
  {
    category: 'dasar',
    question: 'Bagaimana cara mengekspor data keuangan keluarga?',
    answer:
      'Masuk ke tab "Saya" → "Laporan & Ekspor Data". Anda dapat memilih ekspor CSV dengan filter rentang waktu atau mengunduh Paket Lengkap Seluruh Data Finansial Keluarga (transaksi, rekening, impian, anggaran, dan template).',
  },
  {
    category: 'keamanan',
    question: 'Bagaimana prosedur menghapus akun secara permanen?',
    answer:
      'Anda memiliki hak kepemilikan data seutuhnya. Masuk ke tab "Saya" → "Keamanan & Privasi" → "Hapus Akun". Sistem menyediakan alur konfirmasi bertahap dengan mengetikkan konfirmasi untuk menghapus profil dan data personal Anda secara permanen dari server.',
  },
  {
    category: 'dasar',
    question: 'Bagaimana cara memasang LEGAKU sebagai aplikasi di ponsel (PWA)?',
    answer:
      'Buka LEGAKU di browser ponsel Anda. Di Android (Chrome), ketuk menu titik tiga (⋮) lalu pilih "Pasang Aplikasi" atau "Tambahkan ke Layar Utama". Di iPhone (Safari), ketuk tombol Bagikan (Share) lalu pilih "Tambah ke Layar Utama".',
  },
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [selectedCat, setSelectedCat] = useState<'all' | 'dasar' | 'keamanan' | 'ai' | 'kolaborasi'>('all');

  const filteredFaqs = FAQS.filter(
    (f) => selectedCat === 'all' || f.category === selectedCat
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Bantuan & Tanya Jawab (FAQ)"
      subtitle="Jawaban sederhana untuk pertanyaan umum seputar kenyamanan penggunaan LEGAKU."
      size="md"
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Semua Pertanyaan' },
            { id: 'dasar', label: 'Dasar & Penggunaan' },
            { id: 'ai', label: 'LEGAKU AI' },
            { id: 'kolaborasi', label: 'Keluarga & Pasangan' },
            { id: 'keamanan', label: 'Keamanan & Akun' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-colors ${
                selectedCat === cat.id
                  ? 'bg-[#144D3A] text-white'
                  : 'bg-[#E8F2EC] text-[#144D3A] hover:bg-[#d5e7dc]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredFaqs.map((faq, idx) => {
            const isOpenItem = openIdx === idx;
            return (
              <div
                key={faq.question}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpenItem ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-[#1F2937] hover:bg-[#F9FAF7] cursor-pointer gap-2"
                >
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#144D3A] transition-transform duration-200 shrink-0 ${
                      isOpenItem ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpenItem && (
                  <div className="px-4 pb-4 pt-1 text-[#6B7280] leading-relaxed border-t border-[#E5E7EB]/50 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
