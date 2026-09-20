import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { parseVoiceTransaction, SpeechListener } from '../../services/voiceParser';
import { VoiceParseResult } from '../../types';
import { formatRupiah, parseRupiahInput, formatIndoDate } from '../../utils/formatters';
import { Mic, MicOff, Check, Edit2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceTransactionModalProps {
  onSaved: () => void;
  onSwitchToManual: () => void;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({
  onSaved,
  onSwitchToManual,
}) => {
  const { categories, accounts, addTransaction } = useFinance();
  const { profile } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<VoiceParseResult | null>(null);
  const [manualText, setManualText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Editable fields for confirmation card
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccount, setEditAccount] = useState('');

  const listenerRef = useRef<SpeechListener | null>(null);

  useEffect(() => {
    listenerRef.current = new SpeechListener(
      (text) => {
        setIsListening(false);
        const parsed = parseVoiceTransaction(text, categories, accounts);
        setParsedResult(parsed);
        setEditDesc(parsed.description);
        setEditAmount(formatRupiah(parsed.amount));
        setEditCategory(parsed.suggested_category_id || categories[0]?.id || '');
        setEditAccount(parsed.account_id || accounts[0]?.id || '');
      },
      (_err) => {
        setIsListening(false);
        setErrorMsg('Tidak dapat menangkap suara dengan jelas. Anda bisa ketik kalimatnya di bawah.');
      },
      () => {
        setIsListening(false);
      }
    );
  }, [categories, accounts]);

  const toggleListening = () => {
    setErrorMsg('');
    if (isListening) {
      listenerRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setParsedResult(null);
      listenerRef.current?.start();
      setIsListening(true);
    }
  };

  const handleManualSentenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscript(manualText.trim());
    const parsed = parseVoiceTransaction(manualText.trim(), categories, accounts);
    setParsedResult(parsed);
    setEditDesc(parsed.description);
    setEditAmount(formatRupiah(parsed.amount));
    setEditCategory(parsed.suggested_category_id || categories[0]?.id || '');
    setEditAccount(parsed.account_id || accounts[0]?.id || '');
  };

  const handleConfirmSave = async () => {
    if (!parsedResult) return;

    const numAmount = parseRupiahInput(editAmount);
    if (numAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    const res = await addTransaction({
      family_id: '',
      account_id: editAccount,
      category_id: editCategory,
      type: parsedResult.type,
      amount: numAmount,
      transaction_date: parsedResult.date,
      description: editDesc.trim() || 'Transaksi Suara',
      source: 'voice_ai',
      creator_name: profile?.full_name,
    });
    setIsSubmitting(false);

    if (!res.error) {
      confetti({
        particleCount: 30,
        spread: 60,
        colors: ['#467B60', '#C49744'],
      });
      onSaved();
    }
  };

  return (
    <div className="space-y-4 text-center py-2">
      {!parsedResult ? (
        <div className="space-y-4">
          {/* Microphone Visualizer Circle */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-elevated transition-all duration-300 relative ${
                isListening
                  ? 'bg-earth-terracotta text-white scale-105 ring-8 ring-earth-terracotta/20 animate-pulse'
                  : 'bg-forest-800 text-white hover:bg-forest-900 active:scale-95'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              {isListening && (
                <span className="absolute -bottom-7 text-[11px] font-semibold text-earth-rust">
                  Mendengarkan...
                </span>
              )}
            </button>

            <div className="mt-7 text-center">
              <h3 className="text-base font-bold text-forest-950">
                {isListening ? 'Silakan Bicara Sekarang' : 'Tekan Tombol & Ucapkan Transaksi'}
              </h3>
              <p className="text-xs text-warm-muted max-w-xs mx-auto mt-1 leading-relaxed">
                Contoh: <span className="italic font-medium text-forest-800">"Catat makan siang empat puluh lima ribu"</span> atau <span className="italic font-medium text-forest-800">"Beli bensin tiga puluh ribu pakai cash"</span>
              </p>
            </div>
          </div>

          {/* Fallback Sentence Input for Desktops or browsers without mic */}
          <div className="pt-2 border-t border-warm-border/40 text-left space-y-2">
            <span className="text-[11px] text-warm-muted block text-center">
              Atau coba ketik kalimat alami:
            </span>
            <form onSubmit={handleManualSentenceSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Belanja di Superindo 120 ribu hari ini"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="flex-1 bg-cream-50 border border-warm-border rounded-2xl px-3.5 py-2 text-xs text-warm-dark outline-none focus:border-forest-600"
              />
              <Button type="submit" variant="secondary" size="sm" className="rounded-2xl shrink-0">
                Tes Parser
              </Button>
            </form>
          </div>

          {errorMsg && (
            <p className="text-xs text-earth-rust bg-earth-terracotta/10 p-2.5 rounded-xl">
              {errorMsg}
            </p>
          )}
        </div>
      ) : (
        /* STRUCTURED CONFIRMATION CARD (Human-in-the-Loop) */
        <div className="space-y-4 text-left">
          <div className="bg-sage-50 border border-sage-200/80 rounded-3xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-earth-gold" />
                Saya menangkap:
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {isEditing ? 'Selesai Edit' : 'Edit'}
              </button>
            </div>

            {/* Transcript preview */}
            <p className="text-xs text-warm-muted italic bg-white/70 p-2.5 rounded-xl border border-warm-border/50">
              "{parsedResult.raw_transcript}"
            </p>

            {/* Structured Fields */}
            {isEditing ? (
              <div className="space-y-2.5 pt-1">
                <Input
                  label="Deskripsi"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
                <Input
                  label="Nominal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(formatRupiah(parseRupiahInput(e.target.value)))}
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-warm-muted uppercase">Kategori</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-white border border-warm-border rounded-xl p-2 text-xs"
                  >
                    {categories
                      .filter((c) => c.type === parsedResult.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-warm-muted uppercase">Rekening</label>
                  <select
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    className="w-full bg-white border border-warm-border rounded-xl p-2 text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatRupiah(a.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-3 border border-warm-border/60 divide-y divide-warm-border/30 text-xs">
                <div className="flex justify-between py-1.5">
                  <span className="text-warm-muted">Deskripsi</span>
                  <span className="font-bold text-warm-dark">{editDesc}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-warm-muted">Nominal</span>
                  <span className="font-bold text-forest-800 text-sm">{editAmount}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-warm-muted">Kategori</span>
                  <span className="font-semibold text-warm-dark">
                    {categories.find((c) => c.id === editCategory)?.name || 'Kategori'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-warm-muted">Rekening</span>
                  <span className="font-semibold text-warm-dark">
                    {accounts.find((a) => a.id === editAccount)?.name || 'Akun'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-warm-muted">Tanggal</span>
                  <span className="text-warm-dark">{formatIndoDate(parsedResult.date)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setParsedResult(null)}
              className="flex-1"
            >
              Ulangi Suara
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleConfirmSave}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Simpan Transaksi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
