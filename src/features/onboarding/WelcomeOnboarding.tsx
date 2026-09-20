import React, { useState } from 'react';
import { Sparkles, Heart, Users, Compass, ArrowRight, CheckCircle2, ShieldCheck, ChevronRight, X } from 'lucide-react';
import { trackEvent } from '../../services/analytics/productAnalytics';
import { Logo } from '../../components/ui/Logo';

interface WelcomeOnboardingProps {
  isOpen: boolean;
  onComplete: (useDemoData: boolean) => void;
  onClose?: () => void;
}

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
  isOpen,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Dana Darurat Tenang']);
  const [familyType, setFamilyType] = useState<'couple' | 'family' | 'personal'>('couple');
  const [partnerName, setPartnerName] = useState<string>('');

  if (!isOpen) return null;

  const goalOptions = [
    { id: 'emergency', label: '🛡️ Dana Darurat Tenang', desc: 'Minimal 3-6 bulan pengeluaran' },
    { id: 'home', label: '🏡 Rumah / Tempat Tinggal', desc: 'DP atau renovasi impian' },
    { id: 'education', label: '🎓 Pendidikan Anak', desc: 'Investasi masa depan buah hati' },
    { id: 'vacation', label: '✈️ Liburan Keluarga', desc: 'Momen berharga melepas penat' },
    { id: 'debt_free', label: '🕊️ Hidup Bebas Beban Utang', desc: 'Pernafasan finansial lebih plong' },
    { id: 'vehicle', label: '🚗 Kendaraan Keluarga', desc: 'Mobilitas aman dan nyaman' },
  ];

  const toggleGoal = (label: string) => {
    if (selectedGoals.includes(label)) {
      setSelectedGoals(selectedGoals.filter(g => g !== label));
    } else {
      setSelectedGoals([...selectedGoals, label]);
    }
  };

  const handleFinish = (useDemo: boolean) => {
    trackEvent('onboarding_completed', {
      family_type: familyType,
      goals_count: selectedGoals.length,
      used_demo: useDemo,
    });
    localStorage.setItem('legaku_onboarded', 'true');
    onComplete(useDemo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col border border-[#E5E7EB]">
        {/* Top Progress indicator */}
        <div className="bg-[#144D3A] p-6 text-white relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          )}

          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-white/60' : 'w-4 bg-white/20'
                }`}
              />
            ))}
            <span className="text-[11px] font-semibold text-white/80 ml-auto uppercase tracking-wider">
              Langkah {step} dari 4
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            {step === 1 && 'Selamat Datang di LEGAKU'}
            {step === 2 && 'Apa Fokus Impian Finansial Anda?'}
            {step === 3 && 'Finansial Bersama yang Tenang'}
            {step === 4 && 'Mulai Pengalaman Finansial Anda'}
          </h2>
          <p className="text-white/80 text-xs mt-1 leading-relaxed">
            {step === 1 && 'Atur uang. Hidup lebih lega. Teman terpercaya keluarga Anda.'}
            {step === 2 && 'Pilih satu atau beberapa tujuan penting untuk keluarga Anda.'}
            {step === 3 && 'Uang bukan lagi sumber beban, melainkan ruang untuk bertumbuh bersama.'}
            {step === 4 && 'Pilih cara Anda ingin memulai perjalanan hari ini.'}
          </p>
        </div>

        {/* Dynamic Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-[#1F2937]">
          {/* STEP 1: WELCOME & PHILOSOPHY */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Couple artwork card */}
              <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xs bg-[#E8F2EC]/40 relative">
                <img
                  src="/welcome-couple-clean.jpg"
                  alt="Keluarga Bahagia LEGAKU"
                  className="w-full h-44 object-cover object-center"
                />
                <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-[#E5E7EB] text-center">
                  <p className="text-xs font-bold text-[#144D3A] leading-snug">
                    "Keuangan yang baik membawa lebih banyak waktu untuk hal yang kamu cintai."
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#E8F2EC] border border-[#D2E5DA] flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#144D3A] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Heart size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#144D3A]">Filosofi Ruang Bernapas</h4>
                  <p className="text-[11px] text-[#1F2937]/80 mt-0.5 leading-relaxed">
                    LEGAKU dirancang bukan untuk menghakimi setiap rupiah belanjaan Anda, melainkan memberi kejelasan agar hidup Anda sekeluarga lebih lapang dan tenang.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2.5 text-xs text-[#6B7280]">
                  <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                  <span>Tanpa rasa bersalah atau intimidasi grafik rumit</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#6B7280]">
                  <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                  <span>Transparansi harmonis bersama pasangan dan keluarga</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#6B7280]">
                  <CheckCircle2 size={16} className="text-[#144D3A] shrink-0" />
                  <span>AI Companion bijak yang memprioritaskan ketenangan mental</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MULTI-SELECT GOALS */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pilih impian yang ingin Anda wujudkan (bisa diubah kapan saja):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {goalOptions.map(opt => {
                  const isSelected = selectedGoals.includes(opt.label);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleGoal(opt.label)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'border-[#144D3A] bg-[#E8F2EC] text-[#144D3A] ring-2 ring-[#144D3A]/20 shadow-sm font-medium'
                          : 'border-[#E5E7EB] hover:border-[#9CA3AF] bg-white text-[#1F2937]'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: FAMILY SETUP */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-[#6B7280]">
                Bagaimana Anda ingin mengelola keuangan ini?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'couple', title: 'Pasangan / Suami Istri', icon: '💍' },
                  { id: 'family', title: 'Keluarga & Anak', icon: '👨‍👩‍👧' },
                  { id: 'personal', title: 'Personal / Mandiri', icon: '🌱' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFamilyType(item.id as any)}
                    className={`p-3 rounded-2xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                      familyType === item.id
                        ? 'border-[#144D3A] bg-[#E8F2EC] text-[#144D3A] ring-2 ring-[#144D3A]/20 font-bold shadow-sm'
                        : 'border-[#E5E7EB] hover:border-[#9CA3AF] bg-white text-[#6B7280]'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[11px] leading-tight mt-1">{item.title}</span>
                  </button>
                ))}
              </div>

              {familyType !== 'personal' && (
                <div className="p-4 rounded-2xl bg-[#F9FAF7] border border-[#E5E7EB] space-y-2">
                  <label className="text-xs font-bold text-[#1F2937] block">
                    Nama Pasangan / Anggota Keluarga (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dinda (Istri)"
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#144D3A]/20 focus:border-[#144D3A] bg-white"
                  />
                  <p className="text-[11px] text-[#9CA3AF]">
                    Anda bisa mengundang pasangan bergabung lewat link instan di tab Profil kapan saja.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: FIRST VALUE MOMENT */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center p-3">
                <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                  ✨
                </div>
                <h4 className="text-sm font-bold text-[#1F2937]">Ruang Finansial Anda Sudah Siap!</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Pilih cara Anda ingin menjelajahi dan merasakan kenyamanan LEGAKU.
                </p>
              </div>

              <div className="space-y-3">
                {/* Option A: Demo Data */}
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  className="w-full p-4 rounded-2xl border-2 border-[#144D3A] bg-[#E8F2EC]/60 hover:bg-[#E8F2EC] text-left transition-all group flex items-start gap-3.5 shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#144D3A] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    🚀
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#144D3A]">Eksplorasi dengan Data Nyata (Rekomendasi)</span>
                      <span className="text-[10px] uppercase font-bold bg-[#144D3A] text-white px-2 py-0.5 rounded-full">Instan</span>
                    </div>
                    <p className="text-xs text-[#1F2937]/80 mt-1 leading-relaxed">
                      Langsung coba AI Companion, analisis kesehatan finansial, simulasi impian, dan ringkasan bulanan dengan data simulasi keluarga.
                    </p>
                  </div>
                </button>

                {/* Option B: Empty slate */}
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  className="w-full p-3.5 rounded-2xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAF7] text-left transition-all flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    📝
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-[#1F2937]">Mulai dari Lembar Bersih</span>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
                      Mulai mencatat transaksi dari nol secara mandiri sesuai dompet riil Anda.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-[#F9FAF7] border-t border-[#E5E7EB] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Kembali
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-2xl bg-[#144D3A] text-white font-semibold text-xs hover:bg-[#2E7D61] transition-all flex items-center gap-1.5 shadow-sm ml-auto"
            >
              Lanjutkan
              <ChevronRight size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
