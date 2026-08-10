/**
 * Every payment provider (only PayOS this sprint) implements this exactly — nothing outside
 * `payment/providers/**` ever imports a provider-specific type or SDK. Mirrors the Companion
 * `AIProvider` interface precedent (`companion/providers/ai-provider.interface.ts`).
 */
export type PaymentProviderName = 'payos';

export interface CreatePaymentInput {
  /** Our own generated reference (see `generateOrderCode`) — echoed back by the provider on every
   * webhook delivery; this is what correlates a webhook to a `PaymentOrder`. */
  orderCode: number;
  /** Smallest whole currency unit the provider expects — VND has no subunit, so this is VND itself. */
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentResult {
  checkoutUrl: string;
  providerPaymentLinkId: string;
}

export type VerifiedPaymentStatus = 'PAID' | 'FAILED' | 'CANCELLED';

export interface VerifiedWebhookPayment {
  orderCode: number;
  amount: number;
  currency: string;
  status: VerifiedPaymentStatus;
  /** Provider's own transaction/bank reference — combined with `orderCode` to form the webhook
   * idempotency key (`PaymentWebhookEvent.externalEventId`). */
  reference: string;
  description: string;
}

export class PaymentProviderSignatureError extends Error {
  constructor(message = 'Webhook signature verification failed') {
    super(message);
    this.name = 'PaymentProviderSignatureError';
  }
}

export class PaymentProviderUnavailableError extends Error {
  constructor(providerName: string) {
    super(`Payment provider "${providerName}" is not configured (missing credentials)`);
    this.name = 'PaymentProviderUnavailableError';
  }
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** Creates a hosted checkout session. Never throws for a "declined card" style outcome (there is
   * no card yet at this point) — only for a provider/network/config failure. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  /** Verifies the raw webhook payload's signature and returns the parsed, trustworthy payment
   * result. Throws `PaymentProviderSignatureError` if the signature is missing or invalid — the
   * caller must never act on a payload that failed this check. */
  verifyWebhook(payload: unknown): VerifiedWebhookPayment;
}
