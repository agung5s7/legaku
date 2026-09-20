import { PaymentProvider, MockPaymentProvider, CheckoutRequest, CheckoutResponse } from './provider';

export class CheckoutManager {
  private static provider: PaymentProvider = new MockPaymentProvider();

  public static setProvider(provider: PaymentProvider): void {
    this.provider = provider;
  }

  public static getProviderName(): string {
    return this.provider.name;
  }

  public static async initiateCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    if (!request.userId || !request.planSlug) {
      throw new Error('Permintaan checkout memerlukan ID pengguna dan paket langganan.');
    }

    return this.provider.createCheckoutSession(request);
  }
}
