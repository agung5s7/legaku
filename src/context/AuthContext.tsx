import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_PROFILES } from '../lib/demoData';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  register: (email: string, pass: string, fullName: string) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  switchDemoUser: (index: number) => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_DEMO_USER_KEY = 'legaku_demo_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsDemoMode(false);
            localStorage.removeItem(LOCAL_DEMO_USER_KEY);
            setUser({ id: session.user.id, email: session.user.email || '' });
            
            // Fetch or create profile
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (prof) {
              setProfile(prof as UserProfile);
            } else {
              const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Anggota Keluarga';
              const newProf = {
                id: session.user.id,
                full_name: fallbackName,
              };
              setProfile(newProf);
              try {
                await supabase.from('profiles').upsert(newProf);
              } catch {}
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase auth init failed:', e);
        }
      }

      // Check if user previously engaged with interactive demo
      const savedDemoId = localStorage.getItem(LOCAL_DEMO_USER_KEY);
      if (savedDemoId) {
        setIsDemoMode(true);
        const initialProfile = DEMO_PROFILES.find((p) => p.id === savedDemoId) || DEMO_PROFILES[0];
        setUser({
          id: initialProfile.id,
          email: initialProfile.id.includes('andi') ? 'andi@keluarga.id' : 'sinta@keluarga.id',
        });
        setProfile(initialProfile);
      } else {
        // Unauthenticated state: user is null so WelcomeGate / AuthPage is presented
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setIsDemoMode(false);
          localStorage.removeItem(LOCAL_DEMO_USER_KEY);
          setUser({ id: session.user.id, email: session.user.email || '' });
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (prof) {
            setProfile(prof as UserProfile);
          } else {
            const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Anggota Keluarga';
            setProfile({ id: session.user.id, full_name: fallbackName });
          }
        } else if (event === 'SIGNED_OUT') {
          setIsDemoMode(false);
          localStorage.removeItem(LOCAL_DEMO_USER_KEY);
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ error?: string }> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        if (data?.session && data.user) {
          setIsDemoMode(false);
          localStorage.removeItem(LOCAL_DEMO_USER_KEY);
          setUser({ id: data.user.id, email: data.user.email || email });
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (prof) {
            setProfile(prof as UserProfile);
          } else {
            const fallbackName = data.user.user_metadata?.full_name || email.split('@')[0] || 'Anggota Keluarga';
            const newProf = {
              id: data.user.id,
              full_name: fallbackName,
            };
            setProfile(newProf);
            try {
              await supabase.from('profiles').upsert(newProf);
            } catch {}
          }
        }
        setLoading(false);
        return {};
      } else {
        // Offline demo mode login
        setIsDemoMode(true);
        const foundProfile = email.toLowerCase().includes('sinta') ? DEMO_PROFILES[1] : DEMO_PROFILES[0];
        localStorage.setItem(LOCAL_DEMO_USER_KEY, foundProfile.id);
        setUser({ id: foundProfile.id, email });
        setProfile(foundProfile);
        setLoading(false);
        return {};
      }
    } catch {
      setLoading(false);
      return { error: 'Terjadi kendala saat login. Silakan coba lagi.' };
    }
  };

  const register = async (
    email: string,
    pass: string,
    fullName: string
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && !isDemoMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }

        // If email confirmation is required, session is null
        if (!data.session) {
          setLoading(false);
          return { requiresEmailConfirmation: true };
        }

        // If session is immediately available (e.g. email confirmation disabled in Supabase)
        if (data.user && data.session) {
          setUser({ id: data.user.id, email: data.user.email || email });
          setProfile({
            id: data.user.id,
            full_name: fullName,
          });

          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName,
            });
          } catch {
            // Handled or non-fatal
          }
        }

        setLoading(false);
        return {};
      } else {
        // Demo new user registration
        const newId = `user-custom-${Date.now()}`;
        const newProf: UserProfile = {
          id: newId,
          full_name: fullName,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_DEMO_USER_KEY, newId);
        setUser({ id: newId, email });
        setProfile(newProf);
        setLoading(false);
        return {};
      }
    } catch {
      setLoading(false);
      return { error: 'Pendaftaran belum berhasil. Silakan periksa kembali data Anda.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setIsDemoMode(false);
    localStorage.removeItem(LOCAL_DEMO_USER_KEY);
    setUser(null);
    setProfile(null);
  };

  const switchDemoUser = (index: number) => {
    setIsDemoMode(true);
    const target = DEMO_PROFILES[index % DEMO_PROFILES.length];
    localStorage.setItem(LOCAL_DEMO_USER_KEY, target.id);
    setUser({
      id: target.id,
      email: target.id.includes('andi') ? 'andi@keluarga.id' : 'sinta@keluarga.id',
    });
    setProfile(target);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoMode,
        login,
        register,
        logout,
        switchDemoUser,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
