import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Family, FamilyMember } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
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

    if (isSupabaseConfigured) {
      try {
        // 1. Fetch membership without joining profiles directly (prevents PGRST200 schema error)
        let { data: memberRows, error: memberErr } = await supabase
          .from('family_members')
          .select('id, family_id, user_id, role, joined_at')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        // 2. Self-healing check: if user created a family but family_members record is missing
        if ((!memberRows || memberRows.length === 0) && user.id) {
          const { data: createdFams } = await supabase
            .from('families')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

          if (createdFams && createdFams.length > 0) {
            const primaryFam = createdFams[0];
            await supabase.from('family_members').upsert(
              {
                family_id: primaryFam.id,
                user_id: user.id,
                role: 'owner',
              },
              { onConflict: 'family_id,user_id' }
            );

            const { data: refreshedMems } = await supabase
              .from('family_members')
              .select('id, family_id, user_id, role, joined_at')
              .eq('user_id', user.id)
              .order('joined_at', { ascending: false });

            if (refreshedMems && refreshedMems.length > 0) {
              memberRows = refreshedMems;
            }
          }
        }

        if (memberRows && memberRows.length > 0) {
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
              .select('id, family_id, user_id, role, joined_at')
              .eq('family_id', activeFamilyId);

            if (allMembers && allMembers.length > 0) {
              const userIds = allMembers.map((m: any) => m.user_id);
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

              const profMap = new Map((profs || []).map((p: any) => [p.id, p]));
              const formatted: FamilyMember[] = allMembers.map((m: any) => ({
                id: m.id,
                family_id: m.family_id,
                user_id: m.user_id,
                role: m.role,
                joined_at: m.joined_at,
                profile: profMap.get(m.user_id) || {
                  id: m.user_id,
                  full_name: m.role === 'owner' ? 'Kepala Keluarga' : 'Pasangan',
                },
              }));
              setMembers(formatted);
            }

            // Auto-seed starter accounts if family has none
            const { count: accCount } = await supabase
              .from('accounts')
              .select('*', { count: 'exact', head: true })
              .eq('family_id', activeFamilyId);

            if (accCount === 0 || accCount === null) {
              try {
                await supabase.from('accounts').insert([
                  { family_id: activeFamilyId, name: 'Dompet Tunai', type: 'cash', initial_balance: 0, current_balance: 0 },
                  { family_id: activeFamilyId, name: 'Rekening Bank Utama', type: 'bank', initial_balance: 0, current_balance: 0 },
                  { family_id: activeFamilyId, name: 'E-Wallet', type: 'ewallet', initial_balance: 0, current_balance: 0 },
                ]);
              } catch {}
            }
          }
        } else {
          setFamily(null);
          setMembers([]);
        }
      } catch (err) {
        console.warn('Error fetching family from Supabase:', err);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const createFamily = async (name: string): Promise<{ error?: string; family?: Family }> => {
    if (!user) return { error: 'Sesi pengguna tidak ditemukan' };
    const inviteCode = generateInviteCode();

    if (isSupabaseConfigured) {
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

        // Seed starter accounts for new family
        try {
          await supabase.from('accounts').insert([
            { family_id: newFam.id, name: 'Dompet Tunai', type: 'cash', initial_balance: 0, current_balance: 0 },
            { family_id: newFam.id, name: 'Rekening Bank Utama', type: 'bank', initial_balance: 0, current_balance: 0 },
            { family_id: newFam.id, name: 'E-Wallet', type: 'ewallet', initial_balance: 0, current_balance: 0 },
          ]);
        } catch {}

        await loadFamilyData();
        return { family: newFam as Family };
      } catch (e: any) {
        return { error: e?.message || 'Terjadi kesalahan sistem' };
      }
    }
    return { error: 'Supabase tidak terkonfigurasi' };
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

    if (isSupabaseConfigured) {
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
    }
    return { error: 'Supabase tidak terkonfigurasi' };
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
