import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../context/FamilyContext';
import { useFinance } from '../../context/FinanceContext';
import { Users, UserCheck, Share2, Bell } from 'lucide-react';
import { LeafMark } from '../ui/Logo';

interface TopHeaderProps {
  onOpenInvite: () => void;
  onOpenNotifications?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenInvite, onOpenNotifications }) => {
  const { profile, user } = useAuth();
  const { family, members } = useFamily();
  const { notifications } = useFinance();

  const otherMembers = members.filter((m) => m.user_id !== user?.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all font-sans">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand & Family Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-1 sm:mr-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#E8F2EC] flex items-center justify-center shadow-subtle shrink-0">
            <LeafMark size={24} className="sm:hidden" />
            <LeafMark size={28} className="hidden sm:block" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-[#144D3A] tracking-tight leading-tight truncate">
                {family?.name || 'LEGAKU'}
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-[#6B7280] flex items-center gap-1 leading-none mt-0.5 truncate">
              <span className="truncate">{profile?.full_name?.split(' ')[0] || 'Keluarga'}</span>
              {otherMembers.length > 0 && (
                <>
                  <span className="text-[#D1D5DB] shrink-0">•</span>
                  <span className="text-[#2E7D61] font-medium flex items-center gap-0.5 truncate">
                    <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#2E7D61] shrink-0" />
                    <span className="truncate">{otherMembers[0].profile?.full_name?.split(' ')[0] || 'Pasangan'}</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Notification Bell Icon */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#E8F2EC] hover:bg-[#d9ecdf] border border-[#E5E7EB] text-[#144D3A] transition-all active:scale-95 cursor-pointer shadow-subtle shrink-0"
            aria-label="Pusat Notifikasi"
            title="Pusat Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#EF4444] text-white font-bold text-[9px] flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>


          {/* Invite Partner button */}
          <button
            onClick={onOpenInvite}
            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#144D3A] hover:bg-[#1B5E46] text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-subtle shrink-0"
            title="Undang Pasangan"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden min-[420px]:inline sm:inline">Undang</span>
          </button>
        </div>
      </div>
    </header>
  );
};
