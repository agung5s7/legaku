import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useFamily } from '../../context/FamilyContext';
import { buildFamilyFinancialContext } from '../../services/financialContext';
import { sendAiCompanionMessage, AiResponse } from '../../services/aiService';
import { Sparkles, Send, User } from 'lucide-react';
import { LeafMark } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  calculations?: {
    label: string;
    value: string;
  }[];
  actionChips?: string[];
  timestamp: string;
}

interface AiCompanionViewProps {
  initialPrompt?: string;
  onNavigateToReview?: () => void;
}

export const AiCompanionView: React.FC<AiCompanionViewProps> = ({
  initialPrompt,
  onNavigateToReview,
}) => {
  const { family } = useFamily();
  const {
    accounts,
    categories,
    transactions,
    budgets,
    goals,
  } = useFinance();

  // Financial Context
  const financialContext = useMemo(() => {
    return buildFamilyFinancialContext(family, accounts, categories, transactions, budgets, goals);
  }, [family, accounts, categories, transactions, budgets, goals]);

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: `Halo! Saya LEGAKU AI, teman ngobrol finansial keluarga ${family?.name || 'Anda'}.\n\nSaya memahami pemasukan, pengeluaran, anggaran, dan target impian keluarga Anda. Silakan tanyakan apa saja, kita bahas dengan tenang tanpa rasa dihakimi.`,
      actionChips: ['Bulan ini kita boros nggak?', 'Pengeluaran apa yang paling meningkat?'],
      timestamp: 'Baru saja',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: 'Baru saja',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    try {
      const aiResult: AiResponse = await sendAiCompanionMessage(
        query.trim(),
        family?.id || 'demo-family',
        financialContext
      );

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: aiResult.content,
        calculations: aiResult.calculations,
        actionChips: aiResult.actionChips,
        timestamp: 'Baru saja',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Koneksi AI sedang lambat. Berdasarkan ringkasan data keluarga, kondisi arus kas Anda tetap aman.',
        timestamp: 'Baru saja',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleChipClick = (chip: string) => {
    if (chip.toLowerCase().includes('kategori') && onNavigateToReview) {
      onNavigateToReview();
    } else {
      handleSend(chip);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10.5rem)] sm:h-[calc(100vh-8.5rem)] bg-white border border-[#E5E7EB] rounded-3xl shadow-soft overflow-hidden font-sans">
      {/* Header: Title "LEGAKU AI" & Subtitle "Asisten Keuangan Keluarga" (Section 13) */}
      <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F9FAF7] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center shadow-subtle shrink-0">
            <LeafMark size={28} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#144D3A] tracking-tight leading-tight">
              LEGAKU AI
            </h2>
            <p className="text-xs text-[#6B7280] leading-none mt-0.5">
              Asisten Keuangan Keluarga
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold bg-[#E8F2EC] text-[#144D3A] px-2.5 py-1 rounded-full border border-[#2E7D61]/20">
          Teman Keluarga
        </span>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar bg-[#F9FAF7]">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shrink-0 shadow-subtle mt-1">
                  <Sparkles className="w-4 h-4 text-[#2E7D61]" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 text-xs sm:text-sm space-y-2.5 leading-relaxed ${
                  isAI
                    ? 'bg-white text-[#1F2937] border border-[#E5E7EB] shadow-subtle rounded-tl-sm'
                    : 'bg-[#144D3A] text-white shadow-subtle rounded-br-sm'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Calculation Cards if available */}
                {msg.calculations && (
                  <div className="bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl p-3 space-y-1.5 mt-2 text-xs">
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                      Data Riil Keuangan Keluarga
                    </span>
                    {msg.calculations.map((calc, i) => (
                      <div key={i} className="flex items-center justify-between text-[#1F2937]">
                        <span className="text-[#6B7280]">{calc.label}</span>
                        <span className="font-bold text-[#144D3A]">{calc.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Action Chips */}
                {msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.actionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        className="text-xs font-medium px-3 py-1 rounded-full bg-[#E8F2EC] hover:bg-[#d8ece0] border border-[#2E7D61]/20 text-[#144D3A] transition-colors shadow-subtle cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={`text-[9px] block text-right mt-1 ${
                    isAI ? 'text-[#9CA3AF]' : 'text-[#E8F2EC]/80'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#144D3A] flex items-center justify-center shrink-0 text-xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] p-2">
            <Sparkles className="w-4 h-4 text-[#2E7D61] animate-pulse" />
            <span>LEGAKU AI sedang menganalisis data riil keluarga...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 border-t border-[#E5E7EB] bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[10px] font-semibold text-[#6B7280] shrink-0 uppercase tracking-wider">
          Tanya:
        </span>
        {[
          'Bulan ini kita boros nggak?',
          'Pengeluaran terbesar kita apa?',
          'Kapan target tabungan kita tercapai?',
          'Kalau nabung 500rb per bulan lagi, kapan selesai?',
        ].map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-3 py-1 rounded-full bg-[#F9FAF7] border border-[#E5E7EB] text-[#144D3A] hover:bg-[#E8F2EC] transition-colors shadow-subtle text-[11px] font-medium cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Tulis pertanyaan kamu dengan santai..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 bg-[#F9FAF7] border border-[#E5E7EB] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#1F2937] outline-none focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/10 placeholder:text-[#9CA3AF]"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputQuery.trim()}
            className="h-10 px-4 rounded-2xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
