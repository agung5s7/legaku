import { PaymentProvider, MockPaymentProvider } from './provider';

export interface WebhookProcessingResult {
  handled: boolean;
  status: 'success' | 'ignored' | 'signature_mismatch' | 'error';
  message: string;
}

export class WebhookHandler {
  private static provider: PaymentProvider = new MockPaymentProvider();

  public static setProvider(provider: PaymentProvider): void {
    this.provider = provider;
  }

  public static async handleWebhook(
    rawPayload: string,
    signature: string,
    secret: string
  ): Promise<WebhookProcessingResult> {
    try {
      const isValid = await this.provider.verifyWebhookSignature(rawPayload, signature, secret);
      if (!isValid) {
        return {
          handled: false,
          status: 'signature_mismatch',
          message: 'Tanda tangan webhook tidak valid.',
        };
      }

      const event = await this.provider.parseWebhookEvent(rawPayload);

      // Dispatch event to subscription state manager
      return {
        handled: true,
        status: 'success',
        message: `Event ${event.eventType} berhasil diproses untuk user ${event.userId}.`,
      };
    } catch (err: unknown) {
      return {
        handled: false,
        status: 'error',
        message: err instanceof Error ? err.message : 'Kesalahan pemrosesan webhook.',
      };
    }
  }
}
