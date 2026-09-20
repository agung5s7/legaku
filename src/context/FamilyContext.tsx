import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Family, FamilyMember } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_FAMILY, DEMO_FAMILY_MEMBERS } from '../lib/demoData';

interface FamilyContextType {
  family: Family | null;
  members: FamilyMember[];
  loading: boolean;
  createFamily: (name: string) => Promise<{ error?: string; family?: Family }>;
  joinFamily: (code: string) => Promise<{ error?: string; success?: boolean }>;
  refreshFamily: () => Promise<void>;
  getInviteLink: () => string;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

const LOCAL_FAMILY_KEY = 'legaku_family_data';
const LOCAL_MEMBERS_KEY = 'legaku_family_members_data';

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isDemoMode } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LEGAKU-${res}`;
  };

  const loadFamilyData = useCallback(async () => {
    if (!user) {
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        // Fetch membership
        const { data: memberRows, error: memberErr } = await supabase
          .from('family_members')
          .select('id, family_id, user_id, role, joined_at, profiles(id, full_name, avatar_url)')
          .eq('user_id', user.id);

        if (!memberErr && memberRows && memberRows.length > 0) {
          const activeFamilyId = memberRows[0].family_id;
          // Fetch family details
          const { data: famData } = await supabase
            .from('families')
            .select('*')
            .eq('id', activeFamilyId)
            .single();

          if (famData) {
            setFamily(famData as Family);
            // Fetch all members in this family
            const { data: allMembers } = await supabase
              .from('family_members')
              .select('id, family_id, user_id, role, joined_at, profiles(id, full_name, avatar_url)')
              .eq('family_id', activeFamilyId);

            if (allMembers) {
              const formatted: FamilyMember[] = allMembers.map((m: any) => ({
                id: m.id,
                family_id: m.family_id,
                user_id: m.user_id,
                role: m.role,
                joined_at: m.joined_at,
                profile: m.profiles || undefined,
              }));
              setMembers(formatted);
            }
          }
        } else {
          setFamily(null);
          setMembers([]);
        }
      } catch (err) {
        console.warn('Error fetching family from Supabase:', err);
      }
    } else {
      // Local demo mode
      const savedFam = localStorage.getItem(LOCAL_FAMILY_KEY);
      const savedMems = localStorage.getItem(LOCAL_MEMBERS_KEY);

      if (savedFam) {
        try {
          setFamily(JSON.parse(savedFam));
        } catch {
          setFamily(DEMO_FAMILY);
        }
      } else {
        setFamily(DEMO_FAMILY);
        localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(DEMO_FAMILY));
      }

      if (savedMems) {
        try {
          setMembers(JSON.parse(savedMems));
        } catch {
          setMembers(DEMO_FAMILY_MEMBERS);
        }
      } else {
        setMembers(DEMO_FAMILY_MEMBERS);
        localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(DEMO_FAMILY_MEMBERS));
      }
    }

    setLoading(false);
  }, [user, isDemoMode]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const createFamily = async (name: string): Promise<{ error?: string; family?: Family }> => {
    if (!user) return { error: 'Sesi pengguna tidak ditemukan' };
    const inviteCode = generateInviteCode();

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { data: newFam, error: famErr } = await supabase
          .from('families')
          .insert({
            name,
            invite_code: inviteCode,
            created_by: user.id,
          })
          .select()
          .single();

        if (famErr || !newFam) return { error: famErr?.message || 'Gagal membuat keluarga' };

        // Insert creator as owner
        await supabase.from('family_members').insert({
          family_id: newFam.id,
          user_id: user.id,
          role: 'owner',
        });

        await loadFamilyData();
        return { family: newFam as Family };
      } catch (e: any) {
        return { error: e?.message || 'Terjadi kesalahan sistem' };
      }
    } else {
      // Demo Mode
      const newFam: Family = {
        id: `fam-${Date.now()}`,
        name,
        invite_code: inviteCode,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const initialMember: FamilyMember = {
        id: `mem-${Date.now()}`,
        family_id: newFam.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
        profile: profile || undefined,
      };

      setFamily(newFam);
      setMembers([initialMember]);
      localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(newFam));
      localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify([initialMember]));
      return { family: newFam };
    }
  };

  const joinFamily = async (code: string): Promise<{ error?: string; success?: boolean }> => {
    if (!user) return { error: 'Sesi pengguna tidak ditemukan' };
    
    // Smart normalization: trim, uppercase, strip URL prefixes/query params
    let cleanCode = code.trim().toUpperCase();
    if (cleanCode.includes('=')) {
      cleanCode = cleanCode.split('=').pop()?.trim() || cleanCode;
    }
    if (cleanCode.includes('/')) {
      cleanCode = cleanCode.split('/').pop()?.trim() || cleanCode;
    }
    if (!cleanCode.startsWith('LEGAKU-') && cleanCode.length === 6) {
      cleanCode = `LEGAKU-${cleanCode}`;
    }

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        // 1. Try atomic security-definer RPC first (bypasses any RLS edge-cases)
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('join_family_by_invite_code', {
          code: cleanCode,
        });

        if (!rpcErr && rpcRes) {
          if (rpcRes.error) {
            return { error: rpcRes.error };
          }
          await loadFamilyData();
          return { success: true };
        }

        // 2. Direct Query Fallback
        let queryCode = cleanCode;
        let { data: targetFam } = await supabase
          .from('families')
          .select('id, name, invite_code')
          .eq('invite_code', queryCode)
          .maybeSingle();

        // If not found and had no prefix, try with prefix
        if (!targetFam && !queryCode.startsWith('LEGAKU-')) {
          queryCode = `LEGAKU-${queryCode}`;
          const res = await supabase
            .from('families')
            .select('id, name, invite_code')
            .eq('invite_code', queryCode)
            .maybeSingle();
          targetFam = res.data;
        }

        if (!targetFam) {
          return { error: 'Kode undangan tidak ditemukan. Mohon pastikan kode sesuai (contoh: LEGAKU-XXXXXX).' };
        }

        // Check if already a member
        const { data: existingMember } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_id', targetFam.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingMember) {
          const { error: joinErr } = await supabase.from('family_members').insert({
            family_id: targetFam.id,
            user_id: user.id,
            role: 'partner',
          });

          if (joinErr) {
            console.error('Join family error:', joinErr);
            return { error: joinErr.message || 'Gagal bergabung ke keluarga. Silakan coba lagi.' };
          }
        }

        await loadFamilyData();
        return { success: true };
      } catch (e: any) {
        return { error: e?.message || 'Terjadi kesalahan sistem saat memproses kode undangan.' };
      }
    } else {
      // Demo Mode
      if (cleanCode === DEMO_FAMILY.invite_code || cleanCode.startsWith('LEGAKU-')) {
        const joinedMember: FamilyMember = {
          id: `mem-partner-${Date.now()}`,
          family_id: DEMO_FAMILY.id,
          user_id: user.id,
          role: 'partner',
          joined_at: new Date().toISOString(),
          profile: profile || undefined,
        };

        const updatedMembers = [...members.filter((m) => m.user_id !== user.id), joinedMember];
        setFamily(DEMO_FAMILY);
        setMembers(updatedMembers);
        localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(DEMO_FAMILY));
        localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updatedMembers));
        return { success: true };
      } else {
        return { error: 'Kode undangan tidak valid. Gunakan kode seperti LEGAKU-AB12CD.' };
      }
    }
  };

  const getInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const code = family?.invite_code || 'LEGAKU-AB12CD';
    return `${origin}/?invite=${code}`;
  };

  return (
    <FamilyContext.Provider
      value={{
        family,
        members,
        loading,
        createFamily,
        joinFamily,
        refreshFamily: loadFamilyData,
        getInviteLink,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
