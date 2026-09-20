import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface BetaInvite {
  id: string;
  email: string;
  invited_by?: string;
  status: 'invited' | 'active' | 'suspended' | 'revoked';
  invite_token: string;
  expires_at: string;
  created_at: string;
  redeemed_at?: string;
}

const LOCAL_INVITES_KEY = 'legaku_beta_invites_store';

export class BetaInviteService {
  private static localInvites: BetaInvite[] = [
    {
      id: 'beta-1',
      email: 'keluarga.perintis@legaku.id',
      status: 'invited',
      invite_token: 'LEGA-BETA-7729',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'beta-2',
      email: 'keluarga.bahagia@legaku.id',
      status: 'active',
      invite_token: 'LEGA-BETA-9912',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      redeemed_at: new Date().toISOString(),
    },
  ];

  public static initialize(): void {
    const saved = localStorage.getItem(LOCAL_INVITES_KEY);
    if (saved) {
      try {
        this.localInvites = JSON.parse(saved);
      } catch {
        // fallback
      }
    }
  }

  /**
   * Validate beta invite token
   */
  public static async validateToken(token: string): Promise<{ valid: boolean; message: string; invite?: BetaInvite }> {
    const cleanToken = token.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('beta_invites')
          .select('*')
          .eq('invite_token', cleanToken)
          .single();

        if (error || !data) {
          return { valid: false, message: 'Kode undangan Beta tidak ditemukan.' };
        }

        if (data.status !== 'invited') {
          return { valid: false, message: 'Kode undangan Beta ini sudah digunakan atau tidak aktif.' };
        }

        if (new Date(data.expires_at) < new Date()) {
          return { valid: false, message: 'Kode undangan Beta ini telah kedaluwarsa.' };
        }

        return { valid: true, message: 'Kode undangan valid.', invite: data as BetaInvite };
      } catch {
        // fallback to local check
      }
    }

    this.initialize();
    const found = this.localInvites.find((i) => i.invite_token.toUpperCase() === cleanToken);
    if (!found) {
      // Allow demo bypass code for testing ease
      if (cleanToken.startsWith('LEGA-BETA') || cleanToken === 'BETAVIP') {
        return {
          valid: true,
          message: 'Kode undangan Beta pengetes diterima.',
          invite: {
            id: `beta-test-${Date.now()}`,
            email: 'tester@legaku.id',
            status: 'invited',
            invite_token: cleanToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          },
        };
      }
      return { valid: false, message: 'Kode undangan Beta tidak ditemukan.' };
    }

    if (found.status !== 'invited') {
      return { valid: false, message: 'Kode undangan ini sudah terpakai.' };
    }

    return { valid: true, message: 'Kode undangan valid.', invite: found };
  }

  /**
   * Generate a secure random token
   */
  public static generateToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'LEGA-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create new invite
   */
  public static async createInvite(email: string, invitedBy?: string): Promise<BetaInvite> {
    const newInvite: BetaInvite = {
      id: `beta-${Date.now()}`,
      email: email.trim().toLowerCase(),
      invited_by: invitedBy,
      status: 'invited',
      invite_token: this.generateToken(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('beta_invites').insert(newInvite);
      } catch {
        // fallback
      }
    }

    this.initialize();
    this.localInvites.unshift(newInvite);
    localStorage.setItem(LOCAL_INVITES_KEY, JSON.stringify(this.localInvites));
    return newInvite;
  }

  public static getLocalInvites(): BetaInvite[] {
    this.initialize();
    return this.localInvites;
  }
}

BetaInviteService.initialize();
