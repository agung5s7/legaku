/**
 * Payment Provider Abstraction for LEGAKU
 * Flexible interface supporting future Midtrans, Xendit, Stripe, or Mock providers.
 */

export interface CheckoutRequest {
  userId: string;
  familyId?: string;
  planSlug: 'plus' | 'family' | 'founder_lifetime';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: 'IDR' | 'USD';
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResponse {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
  expiresAt: string;
  status: 'initiated' | 'pending';
}

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
  parseWebhookEvent(payload: string): Promise<{
    eventType: 'payment.success' | 'payment.failed' | 'subscription.cancelled' | 'subscription.renewed';
    externalSubscriptionId: string;
    userId: string;
    planSlug: string;
    timestamp: string;
  }>;
}

export class MockPaymentProvider implements PaymentProvider {
  public readonly name = 'internal_mock_ready';

  public async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse> {
    return {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      checkoutUrl: `${request.successUrl}?session_id=mock_success_${request.planSlug}`,
      provider: this.name,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'initiated',
    };
  }

  public async verifyWebhookSignature(_payload: string, _signature: string, _secret: string): Promise<boolean> {
    return true;
  }

  public async parseWebhookEvent(payload: string) {
    const data = JSON.parse(payload);
    return {
      eventType: 'payment.success' as const,
      externalSubscriptionId: data.externalId || `sub_${Date.now()}`,
      userId: data.userId || 'user_demo',
      planSlug: data.planSlug || 'plus',
      timestamp: new Date().toISOString(),
    };
  }
}
