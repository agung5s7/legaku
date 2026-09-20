import { PlanSlug, Plan } from '../../types';
import { DEMO_PLANS } from '../../lib/demoData';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeSuggested?: boolean;
}

export class EntitlementService {
  private static plans: Plan[] = DEMO_PLANS;

  // SHA-256 Hashes of accepted founder codes (Plaintext secret is NEVER stored in client bundle!)
  private static VALID_FOUNDER_HASHES = new Set([
    '81e5b7b99c7595eefbc88439df608405d4b47a13c9ef804ff6ae6a4ba2ff45e0',
    '7fba7ebcc9a8507871bfaeb28cf56f5c875d7146522c0617ad4f4454f7a26f04',
  ]);

  public static getPlan(slug: PlanSlug): Plan {
    return this.plans.find((p) => p.slug === slug) || this.plans[0];
  }

  public static getAllPlans(): Plan[] {
    return this.plans;
  }

  public static canUseAI(planSlug: PlanSlug, currentUsageCount: number): EntitlementCheckResult {
    const plan = this.getPlan(planSlug);
    if (plan.monthly_ai_limit >= 999999) {
      return { allowed: true };
    }

    if (currentUsageCount >= plan.monthly_ai_limit) {
      return {
        allowed: false,
        reason: 'LEGAKU AI sudah membantu cukup banyak bulan ini. Upgrade ke LEGAKU Plus untuk percakapan tanpa batas.',
        upgradeSuggested: true,
      };
    }

    return { allowed: true };
  }

  public static canScanReceipt(planSlug: PlanSlug, currentUsageCount: number): EntitlementCheckResult {
    const plan = this.getPlan(planSlug);
    if (plan.monthly_receipt_limit >= 999999) {
      return { allowed: true };
    }

    if (currentUsageCount >= plan.monthly_receipt_limit) {
      return {
        allowed: false,
        reason: 'Batas kuota foto struk bulan ini telah tercapai. Upgrade ke LEGAKU Plus untuk kuota ekstra.',
        upgradeSuggested: true,
      };
    }

    return { allowed: true };
  }

  public static canUseVoice(planSlug: PlanSlug, currentUsageCount: number): EntitlementCheckResult {
    const plan = this.getPlan(planSlug);
    if (plan.monthly_voice_limit >= 999999) {
      return { allowed: true };
    }

    if (currentUsageCount >= plan.monthly_voice_limit) {
      return {
        allowed: false,
        reason: 'Batas kuota pencatatan suara bulan ini telah tercapai. Nikmati akses tanpa batas di LEGAKU Plus.',
        upgradeSuggested: true,
      };
    }

    return { allowed: true };
  }

  public static canUseAdvancedInsights(planSlug: PlanSlug): boolean {
    return planSlug === 'plus' || planSlug === 'family' || planSlug === 'founder_lifetime';
  }

  public static canUseScenarioSimulator(planSlug: PlanSlug): boolean {
    return planSlug === 'plus' || planSlug === 'family' || planSlug === 'founder_lifetime';
  }

  public static canExportReport(_planSlug: PlanSlug): boolean {
    return true;
  }

  public static isFounder(planSlug: PlanSlug): boolean {
    return planSlug === 'founder_lifetime';
  }

  /**
   * Securely redeem founder code using SHA-256 hash or database RPC
   * The secret string itself is NEVER exposed or compiled into the client bundle.
   */
  public static async redeemFounderCode(rawCode: string): Promise<{ success: boolean; message: string }> {
    const clean = rawCode.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Silakan masukkan kode Founder.' };
    }

    // Compute SHA-256 hash
    let hashHex = '';
    try {
      const msgUint8 = new TextEncoder().encode(clean);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return { success: false, message: 'Gagal memverifikasi kode kriptografi.' };
    }

    // Call Supabase RPC if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('redeem_founder_code', {
          input_code_hash: hashHex,
        });

        if (!error && data) {
          return {
            success: Boolean(data.success),
            message: data.message || 'Verifikasi selesai.',
          };
        }
      } catch {
        // fallback to offline hash verification
      }
    }

    // Offline / Demo verification via cryptographic hash match
    if (this.VALID_FOUNDER_HASHES.has(hashHex)) {
      return {
        success: true,
        message: 'Selamat! Akses Founder Lifetime seumur hidup telah berhasil diaktifkan.',
      };
    }

    return {
      success: false,
      message: 'Kode Founder tidak valid atau kuota telah habis.',
    };
  }
}
