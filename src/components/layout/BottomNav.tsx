import React from 'react';
import { Home, Sparkles, Target, User, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

export type NavTab = 'home' | 'ai' | 'goal' | 'saya';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenCatat: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, onOpenCatat }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] pb-safe shadow-[0_-4px_20px_rgba(20,77,58,0.06)] sm:hidden font-sans">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto relative">
        {/* Tab: Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer',
            activeTab === 'home' ? 'text-[#144D3A]' : 'text-[#6B7280] hover:text-[#144D3A]'
          )}
        >
          <Home className={cn('w-5 h-5 transition-transform duration-200', activeTab === 'home' && 'scale-110 stroke-[2.5]')} />
          <span className={cn('text-[10px] mt-1 font-medium', activeTab === 'home' ? 'font-bold' : '')}>Home</span>
        </button>

        {/* Tab: Goal */}
        <button
          onClick={() => onChangeTab('goal')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer',
            activeTab === 'goal' ? 'text-[#144D3A]' : 'text-[#6B7280] hover:text-[#144D3A]'
          )}
        >
          <Target className={cn('w-5 h-5 transition-transform duration-200', activeTab === 'goal' && 'scale-110 stroke-[2.5]')} />
          <span className={cn('text-[10px] mt-1 font-medium', activeTab === 'goal' ? 'font-bold' : '')}>Goal</span>
        </button>

        {/* Prominent Center Action: Catat (FAB) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenCatat}
            className="w-13 h-13 rounded-full bg-[#144D3A] text-white flex items-center justify-center shadow-elevated hover:bg-[#2E7D61] active:scale-95 transition-all duration-200 ring-4 ring-[#F9FAF7] cursor-pointer"
            aria-label="Catat Transaksi"
            title="Catat Transaksi"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab: AI */}
        <button
          onClick={() => onChangeTab('ai')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 relative cursor-pointer',
            activeTab === 'ai' ? 'text-[#144D3A]' : 'text-[#6B7280] hover:text-[#144D3A]'
          )}
        >
          <div className="relative">
            <Sparkles className={cn('w-5 h-5 transition-transform duration-200', activeTab === 'ai' && 'scale-110 stroke-[2.5] text-[#144D3A]')} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2E7D61] rounded-full" />
          </div>
          <span className={cn('text-[10px] mt-1 font-medium', activeTab === 'ai' ? 'font-bold' : '')}>AI</span>
        </button>

        {/* Tab: Saya */}
        <button
          onClick={() => onChangeTab('saya')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 cursor-pointer',
            activeTab === 'saya' ? 'text-[#144D3A]' : 'text-[#6B7280] hover:text-[#144D3A]'
          )}
        >
          <User className={cn('w-5 h-5 transition-transform duration-200', activeTab === 'saya' && 'scale-110 stroke-[2.5]')} />
          <span className={cn('text-[10px] mt-1 font-medium', activeTab === 'saya' ? 'font-bold' : '')}>Saya</span>
        </button>
      </div>
    </nav>
  );
};
