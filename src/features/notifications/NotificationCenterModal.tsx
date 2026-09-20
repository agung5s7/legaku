import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useFinance } from '../../context/FinanceContext';
import { NotificationItem, NotificationType } from '../../types';
import {
  Bell,
  CheckCheck,
  Calendar,
  AlertTriangle,
  Target,
  Repeat,
  Sparkles,
  TrendingDown,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (url: string, notif: NotificationItem) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onActionClick,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useFinance();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'budget_warning':
      case 'budget_exceeded':
        return <AlertTriangle className="w-4 h-4 text-earth-rust" />;
      case 'recurring_due':
        return <Repeat className="w-4 h-4 text-forest-800" />;
      case 'goal_milestone':
        return <Target className="w-4 h-4 text-earth-gold" />;
      case 'unusual_transaction':
        return <TrendingDown className="w-4 h-4 text-[#8C6618]" />;
      default:
        return <Bell className="w-4 h-4 text-forest-800" />;
    }
  };

  const getNotifBg = (type: NotificationType) => {
    switch (type) {
      case 'budget_warning':
      case 'budget_exceeded':
        return 'bg-earth-terracotta/10 border-earth-terracotta/20';
      case 'recurring_due':
        return 'bg-sage-100/70 border-sage-200';
      case 'goal_milestone':
        return 'bg-earth-gold/15 border-earth-gold/30';
      case 'unusual_transaction':
        return 'bg-cream-100 border-warm-border';
      default:
        return 'bg-cream-100 border-warm-border';
    }
  };

  // Split into "Hari Ini" and "Sebelumnya"
  const todayStr = new Date().toISOString().split('T')[0];
  const todayNotifs = notifications.filter((n) => n.created_at.startsWith(todayStr));
  const previousNotifs = notifications.filter((n) => !n.created_at.startsWith(todayStr));

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.is_read) {
      markNotificationAsRead(notif.id);
    }
    if (notif.action_url && onActionClick) {
      onActionClick(notif.action_url, notif);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pusat Notifikasi"
      subtitle={
        unreadCount > 0
          ? `${unreadCount} pemberitahuan baru yang membutuhkan perhatian tenang Anda.`
          : 'Semua informasi keuangan keluarga Anda sudah rapi dan terkendali.'
      }
    >
      <div className="space-y-4">
        {/* Quick action bar: Mark all as read */}
        {unreadCount > 0 && (
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-warm-muted">
              {unreadCount} belum dibaca
            </span>
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai Semua Sudah Dibaca
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="p-8 text-center bg-cream-50/50 rounded-3xl border border-warm-border/60">
            <Bell className="w-10 h-10 text-warm-muted/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-forest-950">Belum Ada Notifikasi</p>
            <p className="text-xs text-warm-muted mt-1 max-w-xs mx-auto">
              LEGAKU hanya memberi tahu peristiwa penting seperti tagihan jatuh tempo dan capaian target bersama.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {/* HARI INI */}
            {todayNotifs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block px-1">
                  Hari Ini
                </span>
                {todayNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      !notif.is_read ? 'bg-white shadow-soft border-sage-200' : 'bg-cream-50/40 border-warm-border/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getNotifBg(
                          notif.type
                        )}`}
                      >
                        {getNotifIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-xs font-bold leading-tight ${
                              !notif.is_read ? 'text-forest-950' : 'text-warm-dark'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-forest-800 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-warm-dark/80 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Direct Action Button */}
                        {notif.type === 'recurring_due' && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 bg-sage-100 hover:bg-sage-200 px-2.5 py-1 rounded-xl transition-colors">
                              Catat Tagihan Ini <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                        {notif.type === 'budget_warning' && (
                          <div className="mt-2.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 bg-sage-100 hover:bg-sage-200 px-2.5 py-1 rounded-xl transition-colors">
                              Lihat Rincian Anggaran <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEBELUMNYA */}
            {previousNotifs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block px-1">
                  Sebelumnya
                </span>
                {previousNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      !notif.is_read ? 'bg-white shadow-soft border-sage-200' : 'bg-cream-50/40 border-warm-border/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getNotifBg(
                          notif.type
                        )}`}
                      >
                        {getNotifIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-xs font-bold leading-tight ${
                              !notif.is_read ? 'text-forest-950' : 'text-warm-dark'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-forest-800 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-warm-dark/80 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
