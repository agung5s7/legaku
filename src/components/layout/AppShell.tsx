import React, { useState, Suspense, lazy } from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav, NavTab } from './BottomNav';
import { DashboardView } from '../../features/dashboard/DashboardView';
import { CatatModal } from '../../features/transactions/CatatModal';
import { TransferModal } from '../../features/transfers/TransferModal';
import { NotificationCenterModal } from '../../features/notifications/NotificationCenterModal';
import { InvitePartnerModal } from '../../features/family/InvitePartnerModal';
import { OnboardingModal } from '../../features/onboarding/OnboardingModal';
import { FinancialHealthCheckModal } from '../../features/health/FinancialHealthCheckModal';
import { ScenarioSimulatorModal } from '../../features/simulation/ScenarioSimulatorModal';
import { PaywallModal } from '../../features/monetization/PaywallModal';
import { PlanComparisonModal } from '../../features/monetization/PlanComparisonModal';
import { InternalAnalyticsModal } from '../../features/admin/InternalAnalyticsModal';
import { WelcomeOnboarding } from '../../features/onboarding/WelcomeOnboarding';
import { useFamily } from '../../context/FamilyContext';
import { useFinance } from '../../context/FinanceContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { DEMO_SUBSCRIPTION, DEMO_PLANS } from '../../lib/demoData';
import { Subscription, PlanSlug } from '../../types';
import { trackEvent } from '../../services/analytics/productAnalytics';
import {
  Home,
  ReceiptText,
  Target,
  PieChart,
  Sparkles,
  Wallet,
  User,
  Plus,
  BarChart3,
  WifiOff,
  ArrowRightLeft,
} from 'lucide-react';

// Lazy load non-home views for code splitting and instant initial page load
const TransactionsView = lazy(() =>
  import('../../features/transactions/TransactionsView').then((m) => ({ default: m.TransactionsView }))
);
const GoalsView = lazy(() =>
  import('../../features/goals/GoalsView').then((m) => ({ default: m.GoalsView }))
);
const BudgetsView = lazy(() =>
  import('../../features/budgets/BudgetsView').then((m) => ({ default: m.BudgetsView }))
);
const AccountsView = lazy(() =>
  import('../../features/accounts/AccountsView').then((m) => ({ default: m.AccountsView }))
);
const AiCompanionView = lazy(() =>
  import('../../features/ai/AiCompanionView').then((m) => ({ default: m.AiCompanionView }))
);
const MonthlyReviewView = lazy(() =>
  import('../../features/review/MonthlyReviewView').then((m) => ({ default: m.MonthlyReviewView }))
);
const SayaView = lazy(() =>
  import('../../features/profile/SayaView').then((m) => ({ default: m.SayaView }))
);

export type ExtendedView = NavTab | 'transactions' | 'accounts' | 'budgets' | 'review';

const LoadingFallback: React.FC = () => (
  <div className="py-16 text-center space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-[#144D3A] border-t-transparent animate-spin mx-auto" />
    <p className="text-xs text-[#6B7280] font-medium">Memuat halaman dengan tenang...</p>
  </div>
);

export const AppShell: React.FC = () => {
  const { family, loading: familyLoading } = useFamily();
  const isOnline = useOnlineStatus();

  const [currentView, setCurrentView] = useState<ExtendedView>('home');
  const [catatMode, setCatatMode] = useState<'manual' | 'receipt' | 'voice' | 'transfer'>('manual');
  const [isCatatOpen, setIsCatatOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');

  // Phase 4 States
  const { totalBalance, incomeThisMonth, expenseThisMonth, goals } = useFinance();
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [subscription, setSubscription] = useState<Subscription>(DEMO_SUBSCRIPTION);

  React.useEffect(() => {
    const onboarded = localStorage.getItem('legaku_onboarded');
    if (!onboarded && !family && !familyLoading) {
      setShowWelcomeModal(true);
    }
  }, [family, familyLoading]);

  const handleUpdateSubscription = (slug: PlanSlug) => {
    const selectedPlan = DEMO_PLANS.find(p => p.slug === slug) || DEMO_PLANS[0];
    setSubscription({
      id: 'sub_active_user',
      family_id: family?.id || 'demo_family',
      plan_slug: selectedPlan.slug,
      plan: selectedPlan,
      status: slug === 'founder_lifetime' ? 'lifetime' : 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    trackEvent('plan_upgraded', { plan: slug });
  };

  // Check if onboarding is needed (only when loaded and no family exists)
  React.useEffect(() => {
    if (familyLoading) return;
    if (!family) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
      setShowWelcomeModal(false);
      localStorage.setItem('legaku_onboarded', 'true');
    }
  }, [family, familyLoading]);

  const handleOpenCatatWithMode = (mode: 'manual' | 'receipt' | 'voice' | 'transfer' = 'manual') => {
    if (mode === 'transfer') {
      setIsTransferOpen(true);
    } else {
      setCatatMode(mode);
      setIsCatatOpen(true);
    }
  };

  const handleAskAi = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setCurrentView('ai');
  };

  // Sidebar navigation items for tablet/desktop
  const sidebarNav = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'review', label: 'Pengeluaran Bulanan', icon: PieChart, badge: 'Insight AI' },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: ReceiptText },
    { id: 'goal', label: 'Tujuan Keuangan', icon: Target },
    { id: 'budgets', label: 'Anggaran Bulanan', icon: BarChart3 },
    { id: 'ai', label: 'Analisis AI', icon: Sparkles, badge: 'Companion' },
    { id: 'accounts', label: 'Rekening & Dompet', icon: Wallet },
    { id: 'saya', label: 'Profil & Pengaturan', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF7] flex flex-col font-sans text-[#1F2937]">
      {/* Offline Status Notice Banner */}
      {!isOnline && (
        <div className="bg-[#F59E0B]/20 border-b border-[#F59E0B]/40 px-4 py-2 text-center text-xs font-semibold text-[#B45309] flex items-center justify-center gap-2 sticky top-0 z-40">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode offline aktif. Anda tetap dapat membuka aplikasi dan mencatat data di perangkat.</span>
        </div>
      )}

      {/* Top Header */}
      <TopHeader
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex gap-8">
        {/* Desktop Left Sidebar (hidden on mobile) */}
        <aside className="hidden sm:flex flex-col w-64 shrink-0 space-y-4">
          {/* Primary Quick Catat Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleOpenCatatWithMode('manual')}
              className="w-full h-12 rounded-2xl bg-[#144D3A] hover:bg-[#2E7D61] text-white flex items-center justify-center gap-2 font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              Catat Transaksi
            </button>

            <button
              onClick={() => setIsTransferOpen(true)}
              className="w-full h-10 rounded-2xl bg-[#E8F2EC] hover:bg-[#E8F2EC]/80 text-[#144D3A] flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Antar Rekening
            </button>
          </div>

          {/* Nav List */}
          <nav className="space-y-1 pt-2">
            {sidebarNav.map((item) => {
              const IconComp = item.icon;
              const isActive =
                currentView === item.id ||
                (item.id === 'home' && currentView === 'home');

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ExtendedView)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E8F2EC] text-[#144D3A] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#144D3A] hover:bg-[#E8F2EC]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-[#144D3A]' : 'text-[#6B7280]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] bg-[#144D3A] text-white font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Viewport Content */}
        <main className="flex-1 min-w-0 pb-20 sm:pb-8">
          {/* Breadcrumb / Back button if deep into sub-features on mobile */}
          {['transactions', 'accounts', 'budgets', 'review'].includes(currentView) && (
            <div className="sm:hidden mb-3">
              <button
                onClick={() => setCurrentView('home')}
                className="text-xs font-semibold text-[#144D3A] flex items-center gap-1 hover:underline cursor-pointer"
              >
                ← Kembali ke Home
              </button>
            </div>
          )}

          {currentView === 'home' && (
            <DashboardView
              onOpenCatat={handleOpenCatatWithMode}
              onNavigateTab={(tab) => setCurrentView(tab)}
              onViewAllTransactions={() => setCurrentView('transactions')}
              onOpenNotifications={() => setIsNotifOpen(true)}
              onOpenHealthCheck={() => setShowHealthModal(true)}
              onOpenScenario={() => setShowScenarioModal(true)}
            />
          )}

          <Suspense fallback={<LoadingFallback />}>
            {currentView === 'review' && (
              <MonthlyReviewView onAskAi={handleAskAi} />
            )}

            {currentView === 'transactions' && <TransactionsView />}

            {currentView === 'goal' && <GoalsView />}

            {currentView === 'budgets' && <BudgetsView />}

            {currentView === 'accounts' && <AccountsView />}

            {currentView === 'ai' && (
              <AiCompanionView
                initialPrompt={aiInitialPrompt}
                onNavigateToReview={() => setCurrentView('review')}
              />
            )}

            {currentView === 'saya' && (
              <SayaView
                onOpenInvite={() => setIsInviteOpen(true)}
                onOpenAccounts={() => setCurrentView('accounts')}
                onOpenBudgets={() => setCurrentView('budgets')}
                onOpenHealthCheck={() => setShowHealthModal(true)}
                onOpenScenario={() => setShowScenarioModal(true)}
                onOpenPlanComparison={() => setShowPlanModal(true)}
                onOpenAdminAnalytics={() => setShowAdminModal(true)}
                currentSubscription={subscription}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={['home', 'ai', 'goal', 'saya'].includes(currentView) ? (currentView as NavTab) : 'home'}
        onChangeTab={(tab) => setCurrentView(tab)}
        onOpenCatat={() => handleOpenCatatWithMode('manual')}
      />

      {/* Global Modals */}
      <CatatModal
        isOpen={isCatatOpen}
        initialMode={catatMode}
        onClose={() => setIsCatatOpen(false)}
      />
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />
      <NotificationCenterModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onActionClick={(url) => {
          if (url.includes('catat')) handleOpenCatatWithMode('manual');
          else if (url.includes('goal')) setCurrentView('goal');
          else if (url.includes('review')) setCurrentView('review');
          else if (url.includes('transactions')) setCurrentView('transactions');
        }}
      />
      <InvitePartnerModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Phase 4: Growth, Monetization & Intelligence Modals */}
      <FinancialHealthCheckModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        currentIncome={incomeThisMonth}
        currentExpense={expenseThisMonth}
        currentBalance={totalBalance}
        onAskAiCompanion={handleAskAi}
      />

      <ScenarioSimulatorModal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        goals={goals}
        currentMonthlySavings={Math.max(0, incomeThisMonth - expenseThisMonth)}
        onAskAiCompanion={handleAskAi}
      />

      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        currentSubscription={subscription}
        onOpenComparison={() => setShowPlanModal(true)}
        onSelectPlan={handleUpdateSubscription}
      />

      <PlanComparisonModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        currentSubscription={subscription}
        onUpdateSubscription={handleUpdateSubscription}
      />

      <InternalAnalyticsModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        currentPlanSlug={subscription.plan?.slug || 'free'}
        onGrantFounder={() => handleUpdateSubscription('founder_lifetime')}
      />

      <WelcomeOnboarding
        isOpen={showWelcomeModal}
        onComplete={() => setShowWelcomeModal(false)}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  );
};
