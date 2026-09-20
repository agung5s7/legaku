import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { trackEvent } from '../../services/analytics/productAnalytics';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'saran' | 'pengalaman' | 'pertanyaan';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { family } = useFamily();

  const [type, setType] = useState<FeedbackType>('saran');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);

    try {
      const feedbackPayload = {
        id: `fb-${Date.now()}`,
        user_id: user?.id || null,
        family_id: family?.id || null,
        type,
        title: title.trim(),
        message: message.trim(),
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        await supabase.from('feedback').insert(feedbackPayload);
      }

      // Save locally as fallback
      const savedFeedbacks = JSON.parse(localStorage.getItem('legaku_feedback_store') || '[]');
      savedFeedbacks.unshift(feedbackPayload);
      localStorage.setItem('legaku_feedback_store', JSON.stringify(savedFeedbacks));

      trackEvent('feedback_submitted', { type });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 1800);
    } catch {
      // non-blocking fallback
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const types: { key: FeedbackType; label: string; icon: React.ReactNode }[] = [
    { key: 'bug', label: 'Kendala / Bug', icon: <Bug className="w-3.5 h-3.5" /> },
    { key: 'saran', label: 'Saran Fitur', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { key: 'pengalaman', label: 'Cerita / Rasa', icon: <Heart className="w-3.5 h-3.5" /> },
    { key: 'pertanyaan', label: 'Pertanyaan', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kirim Masukan & Cerita"
      subtitle="Bantu kami membuat LEGAKU semakin tenang dan berguna untuk keluarga Anda."
      size="md"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-3 font-sans animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[#E8F2EC] mx-auto flex items-center justify-center text-[#144D3A]">
            <CheckCircle2 className="w-6 h-6 text-[#2E7D61]" />
          </div>
          <h4 className="text-sm font-bold text-[#144D3A]">Terima Kasih Banyak!</h4>
          <p className="text-xs text-[#6B7280] max-w-xs mx-auto">
            Masukan Anda sangat berarti untuk perkembangan kenyamanan finansial keluarga di LEGAKU.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Feedback Type Selector */}
          <div>
            <label className="font-bold text-[#6B7280] uppercase tracking-wider text-[11px] block mb-1.5">
              Jenis Masukan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    type === t.key
                      ? 'border-[#144D3A] bg-[#E8F2EC] text-[#144D3A]'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAF7]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-bold text-[#6B7280] uppercase tracking-wider text-[11px] block mb-1">
              Topik Singkat
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Saran kategori tabungan bersama"
              className="w-full px-3.5 py-2.5 bg-[#F9FAF7] border border-[#E5E7EB] rounded-xl text-xs focus:outline-none focus:border-[#144D3A]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="font-bold text-[#6B7280] uppercase tracking-wider text-[11px] block mb-1">
              Pesan / Detail Masukan
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ceritakan kendala yang dialami atau ide fitur yang ingin Anda lihat di LEGAKU..."
              className="w-full px-3.5 py-2.5 bg-[#F9FAF7] border border-[#E5E7EB] rounded-xl text-xs focus:outline-none focus:border-[#144D3A] resize-none leading-relaxed"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || !title.trim() || !message.trim()}
            className="w-full py-3 text-xs font-semibold gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Kirim Masukan
              </>
            )}
          </Button>
        </form>
      )}
    </Modal>
  );
};
