import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FamilyProvider } from './context/FamilyContext';
import { FinanceProvider } from './context/FinanceContext';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './features/auth/AuthPage';
import { LandingPage } from './features/landing/LandingPage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { WelcomeGate } from './features/welcome/WelcomeGate';
import { LeafMark } from './components/ui/Logo';
import { Loader2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading, switchDemoUser } = useAuth();
  const [unauthView, setUnauthView] = useState<'welcome' | 'landing' | 'auth'>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-14 h-14 rounded-3xl bg-[#E8F2EC] flex items-center justify-center shadow-xs animate-pulse">
          <LeafMark size={32} />
        </div>
        <p className="text-xs text-[#6B7280] flex items-center gap-1.5 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#144D3A]" />
          Membuka ruang finansial keluarga...
        </p>
      </div>
    );
  }

  if (!user) {
    if (unauthView === 'welcome') {
      return (
        <>
          <WelcomeGate
            onStartSignup={() => {
              setAuthMode('register');
              setUnauthView('auth');
            }}
            onStartLogin={() => {
              setAuthMode('login');
              setUnauthView('auth');
            }}
            onStartDemo={() => {
              switchDemoUser(0);
            }}
            onViewLanding={() => {
              setUnauthView('landing');
            }}
          />
        </>
      );
    }

    if (unauthView === 'landing') {
      return (
        <>
          <LandingPage
            onStartSignup={() => {
              setAuthMode('register');
              setUnauthView('auth');
            }}
            onStartLogin={() => {
              setAuthMode('login');
              setUnauthView('auth');
            }}
            onStartDemo={() => {
              switchDemoUser(0);
            }}
            onBackToWelcome={() => {
              setUnauthView('welcome');
            }}
          />
          <PwaInstallPrompt />
        </>
      );
    }

    return (
      <>
        <AuthPage
          initialMode={authMode}
          onBackToLanding={() => setUnauthView('welcome')}
        />
        <PwaInstallPrompt />
      </>
    );
  }

  return (
    <FamilyProvider>
      <FinanceProvider>
        <AppShell />
        <PwaInstallPrompt />
      </FinanceProvider>
    </FamilyProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
