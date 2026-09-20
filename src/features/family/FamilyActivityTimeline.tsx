import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useFamily } from '../../context/FamilyContext';
import { formatDateIndonesian } from '../../utils/formatters';
import {
  Users,
  ReceiptText,
  ArrowRightLeft,
  Target,
  PieChart,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const FamilyActivityTimeline: React.FC = () => {
  const { activities } = useFinance();
  const { family } = useFamily();

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'transaction_created':
        return <ReceiptText className="w-4 h-4 text-forest-800" />;
      case 'transfer_created':
        return <ArrowRightLeft className="w-4 h-4 text-forest-900" />;
      case 'goal_created':
      case 'goal_updated':
        return <Target className="w-4 h-4 text-earth-gold" />;
      case 'budget_updated':
        return <PieChart className="w-4 h-4 text-earth-rust" />;
      default:
        return <Users className="w-4 h-4 text-forest-800" />;
    }
  };

  const getActivityBg = (actionType: string) => {
    switch (actionType) {
      case 'transaction_created':
        return 'bg-sage-100 text-forest-900 border-sage-200';
      case 'transfer_created':
        return 'bg-cream-200/80 text-forest-900 border-warm-border';
      case 'goal_created':
      case 'goal_updated':
        return 'bg-earth-gold/15 text-[#8C6618] border-earth-gold/30';
      default:
        return 'bg-cream-100 text-forest-800 border-warm-border';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white border border-warm-border/60 rounded-3xl p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-800 text-warm-white flex items-center justify-center shadow-soft">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-forest-950">Aktivitas Keluarga</h2>
            <p className="text-xs text-warm-muted">
              Transparansi damai untuk kebersamaan finansial {family?.name || 'Keluarga'}.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-3 pt-3 border-t border-warm-border/40 flex items-center gap-2 text-[11px] text-warm-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600 shrink-0" />
          <span>Percakapan AI dan akun perbankan bersifat pribadi dan aman.</span>
        </div>
      </div>

      {/* Activity Timeline List */}
      {activities.length === 0 ? (
        <div className="bg-white border border-warm-border/60 rounded-3xl p-8 text-center shadow-soft">
          <Users className="w-10 h-10 text-warm-muted/40 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-forest-950">Belum Ada Catatan Aktivitas</h3>
          <p className="text-xs text-warm-muted mt-1 max-w-xs mx-auto">
            Setiap pencatatan transaksi, transfer, atau perubahan target akan terangkum di sini dengan rapi.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-warm-border/60 rounded-3xl p-4 sm:p-5 shadow-soft divide-y divide-warm-border/40">
          {activities.map((item, idx) => (
            <div key={item.id || idx} className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5">
              {/* Actor Initials Badge or Action Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getActivityBg(
                  item.action_type
                )}`}
              >
                {getActivityIcon(item.action_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-forest-950 truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-warm-muted shrink-0">
                    {formatDateIndonesian(item.created_at.split('T')[0])}
                  </span>
                </div>

                {item.description && (
                  <p className="text-xs text-warm-muted mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
