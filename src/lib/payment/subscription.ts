import { PlanSlug } from '../../types';

export type SubscriptionState =
  | 'active'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'webhook_delayed';

export interface AuthoritativeSubscription {
  id: string;
  userId: string;
  familyId?: string;
  planSlug: PlanSlug;
  state: SubscriptionState;
  startedAt: string;
  expiresAt?: string | null;
  gracePeriodEndsAt?: string | null;
  provider: string;
  lastVerifiedAt: string;
}

export class SubscriptionStateManager {
  /**
   * Evaluates if user has access right now based on authoritative state.
   * Handles webhook delays with grace period so user doesn't lose access due to network lag.
   */
  public static hasAccess(sub: AuthoritativeSubscription): boolean {
    if (sub.planSlug === 'founder_lifetime') {
      return true; // Lifetime never expires
    }

    if (sub.state === 'active') {
      if (!sub.expiresAt) return true;
      return new Date(sub.expiresAt) > new Date();
    }

    // Grace period for webhook delay / pending settlement (up to 48 hours grace)
    if (sub.state === 'webhook_delayed' || sub.state === 'pending') {
      if (sub.gracePeriodEndsAt) {
        return new Date(sub.gracePeriodEndsAt) > new Date();
      }
      return true;
    }

    return false;
  }

  /**
   * Transition helper safely updating state with logging
   */
  public static transitionState(
    current: AuthoritativeSubscription,
    nextState: SubscriptionState,
    reason?: string
  ): AuthoritativeSubscription {
    const updated: AuthoritativeSubscription = {
      ...current,
      state: nextState,
      lastVerifiedAt: new Date().toISOString(),
    };

    // If webhook is delayed, give 48 hours grace period
    if (nextState === 'webhook_delayed') {
      const grace = new Date();
      grace.setHours(grace.getHours() + 48);
      updated.gracePeriodEndsAt = grace.toISOString();
    }

    if (nextState === 'active') {
      updated.gracePeriodEndsAt = null;
    }

    return updated;
  }
}
