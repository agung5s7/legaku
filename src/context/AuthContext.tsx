import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_PROFILES } from '../lib/demoData';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  register: (email: string, pass: string, fullName: string) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
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

      // Unauthenticated state: user is null so WelcomeGate / AuthPage is presented
      setUser(null);
      setProfile(null);
      setLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
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
      }
      setLoading(false);
      return { error: 'Supabase tidak dikonfigurasi.' };
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
      if (isSupabaseConfigured) {
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
      }
      setLoading(false);
      return { error: 'Supabase tidak dikonfigurasi.' };
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
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
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
