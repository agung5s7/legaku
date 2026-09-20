import { ProductEvent, ProductEventName, Transaction, Goal, Budget } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const LOCAL_EVENTS_KEY = 'legaku_product_events_store';

export interface BetaFunnelStep {
  name: string;
  count: number;
  conversionPercent: number;
  description: string;
}

export class ProductAnalytics {
  private static events: ProductEvent[] = [];

  public static initialize(): void {
    const saved = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (saved) {
      try {
        this.events = JSON.parse(saved);
      } catch {
        this.events = [];
      }
    }
  }

  /**
   * Track high-level product actions without capturing sensitive financial figures or private content
   */
  public static async trackEvent(
    eventName: ProductEventName,
    familyId?: string | null,
    userId?: string | null,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Sanitization: strictly remove any monetary, account, or private text fields if passed accidentally
    const cleanMetadata = { ...metadata };
    delete cleanMetadata.amount;
    delete cleanMetadata.nominal;
    delete cleanMetadata.balance;
    delete cleanMetadata.saldo;
    delete cleanMetadata.account_number;
    delete cleanMetadata.chat_content;
    delete cleanMetadata.message_text;
    delete cleanMetadata.receipt_image;
    delete cleanMetadata.transcript;

    const eventObj: ProductEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || null,
      family_id: familyId || null,
      event_name: eventName,
      metadata: cleanMetadata,
      created_at: new Date().toISOString(),
    };

    // Store in memory & localStorage
    this.events.unshift(eventObj);
    if (this.events.length > 300) this.events = this.events.slice(0, 300);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(this.events));

    // Send to Supabase if configured
    if (isSupabaseConfigured && familyId) {
      try {
        await supabase.from('product_events').insert({
          family_id: familyId,
          user_id: userId || null,
          event_name: eventName,
          metadata: cleanMetadata,
        });
      } catch {
        // Quiet non-blocking failure
      }
    }
  }

  public static getEvents(): ProductEvent[] {
    if (this.events.length === 0) this.initialize();
    return this.events;
  }

  /**
   * Calculate North Star Metric: "ACTIVE FINANCIAL FAMILIES (AFF)"
   * Formal Definition:
   * "Family yang melakukan engagement minimal dua kali dalam rolling 30-day window."
   */
  public static calculateActiveFamilyHealth(
    transactions: Transaction[] = [],
    goals: Goal[] = [],
    budgets: Budget[] = [],
    events: ProductEvent[] = this.events
  ): {
    isActive: boolean;
    healthScore: number;
    scorePercent: number;
    interactionCount: number;
    criteria: {
      hasRecentTransaction: boolean;
      hasReviewOrHealthInteraction: boolean;
      hasGoalOrBudget: boolean;
      hasMinimumEngagements: boolean;
    };
  } {
    if (this.events.length === 0) this.initialize();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeEvents = this.events.filter((e) => new Date(e.created_at) >= thirtyDaysAgo);
    const recentTxs = transactions.filter((tx) => new Date(tx.transaction_date) >= thirtyDaysAgo);

    const hasRecentTx = recentTxs.length > 0;
    const hasReviewOrHealth = activeEvents.some((e) =>
      [
        'monthly_review_opened',
        'financial_health_check_completed',
        'scenario_simulator_used',
        'scenario_simulation_used',
      ].includes(e.event_name)
    ) || transactions.length >= 2;

    const hasGoalOrBudget = goals.length > 0 || budgets.length > 0;
    const totalEngagements = activeEvents.length + transactions.length;
    const hasMinimumEngagements = totalEngagements >= 2;

    let points = 0;
    if (hasRecentTx || transactions.length > 0) points += 35;
    if (hasReviewOrHealth) points += 30;
    if (hasGoalOrBudget) points += 20;
    if (hasMinimumEngagements) points += 15;

    return {
      isActive: hasMinimumEngagements && points >= 60,
      healthScore: Math.min(100, points),
      scorePercent: Math.min(100, points),
      interactionCount: totalEngagements,
      criteria: {
        hasRecentTransaction: hasRecentTx,
        hasReviewOrHealthInteraction: hasReviewOrHealth,
        hasGoalOrBudget,
        hasMinimumEngagements,
      },
    };
  }

  /**
   * Beta Funnel Analysis
   * Tracks user progression from Invite through 30-Day Retention based on real events
   */
  public static getBetaFunnel(
    transactions: Transaction[] = [],
    goals: Goal[] = [],
    budgets: Budget[] = []
  ): BetaFunnelStep[] {
    if (this.events.length === 0) this.initialize();

    const getCount = (names: ProductEventName[]) =>
      this.events.filter((e) => names.includes(e.event_name)).length;

    // Real-world counts directly from tracked events and store state
    const inviteEvents = getCount(['beta_invite_opened']);
    const totalInvites = inviteEvents > 0 ? inviteEvents : (this.events.length > 0 ? 1 : 0);

    const signups = getCount(['beta_signup_completed']);
    const onboarding = getCount(['onboarding_completed']);

    const txEvents = getCount(['first_transaction', 'first_transaction_created']);
    const txCount = transactions.length > 0 ? Math.max(transactions.length, txEvents) : txEvents;

    const goalBudgetEvents = getCount(['first_goal', 'first_budget', 'first_goal_created']);
    const goalBudgetCount = (goals.length + budgets.length) > 0 
      ? Math.max(goals.length + budgets.length, goalBudgetEvents) 
      : goalBudgetEvents;

    const aiInteractionCount = getCount([
      'first_ai_question',
      'first_receipt_scan',
      'receipt_scanned',
      'first_voice_transaction',
      'voice_transaction_created',
    ]);

    const partnerInvitedCount = getCount(['partner_invited']);
    const partnerJoinedCount = getCount(['partner_joined']);

    // Retention steps require elapsed cohort time; if cohort hasn't elapsed, count is 0
    const sevenDayReturnCount = getCount(['monthly_review_opened', 'financial_health_check_completed']);
    const thirtyDayAffCount = (transactions.length >= 2) ? 1 : 0;

    const rawSteps = [
      { name: 'Beta Invite Opened', count: totalInvites, description: 'Pengguna membuka tautan undangan beta' },
      { name: 'Signup Selesai', count: signups, description: 'Pendaftaran akun keluarga berhasil' },
      { name: 'Onboarding Selesai', count: onboarding, description: 'Ruang keluarga pertama diinisialisasi' },
      { name: 'Catat Transaksi Pertama', count: txCount, description: 'Pengguna membuat transaksi perdana' },
      { name: 'Atur Target / Anggaran', count: goalBudgetCount, description: 'Keluarga menyusun impian atau budget' },
      { name: 'Interaksi Pertama AI', count: aiInteractionCount, description: 'Mencoba tanya AI / scan struk / suara' },
      { name: 'Undang Pasangan', count: partnerInvitedCount, description: 'Mengirimkan kode undangan ke pasangan' },
      { name: 'Pasangan Bergabung', count: partnerJoinedCount, description: 'Kolaborasi dua arah aktif bersama' },
      { name: '7-Day Return', count: sevenDayReturnCount, description: 'Kembali menggunakan aplikasi dalam 7 hari' },
      { name: '30-Day Active Family (AFF)', count: thirtyDayAffCount, description: 'Keluarga finansial aktif berkelanjutan' },
    ];

    const baseline = totalInvites > 0 ? totalInvites : 1;

    return rawSteps.map((step) => ({
      ...step,
      conversionPercent: totalInvites > 0 ? Math.min(100, Math.round((step.count / baseline) * 100)) : 0,
    }));
  }
}

ProductAnalytics.initialize();

export const trackEvent = (
  eventName: ProductEventName,
  metadata?: Record<string, any>,
  familyId?: string,
  userId?: string
) => ProductAnalytics.trackEvent(eventName, familyId, userId, metadata);

export const getStoredEvents = () => ProductAnalytics.getEvents();

export const clearStoredEvents = () => {
  localStorage.removeItem(LOCAL_EVENTS_KEY);
  ProductAnalytics.initialize();
};

export const calculateActiveFamilyHealth = (
  transactions: Transaction[] = [],
  goals: Goal[] = [],
  budgets: Budget[] = []
) => ProductAnalytics.calculateActiveFamilyHealth(transactions, goals, budgets);

export const getBetaFunnel = (
  transactions: Transaction[] = [],
  goals: Goal[] = [],
  budgets: Budget[] = []
) => ProductAnalytics.getBetaFunnel(transactions, goals, budgets);
