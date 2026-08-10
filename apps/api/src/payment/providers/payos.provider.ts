import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderName,
  VerifiedWebhookPayment,
} from './payment-provider.interface';
import { PaymentProviderSignatureError } from './payment-provider.interface';
import { buildPayOSSignatureData, signPayOSData, verifyPayOSSignature } from './payos-signature.util';

export interface PayOSConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
  baseUrl: string;
  /** Outside production only — see env.validation.ts PAYOS_MOCK_CHECKOUT docstring. */
  mockCheckout: boolean;
}

// PayOS signs *every* field actually present in `data` (docs.payos.vn "Kiểm tra dữ liệu với
// signature": "trích xuất toàn bộ các trường trong `data`" — extract every field in `data`), not
// just the subset this codebase happens to name. A real webhook may carry additional fields this
// schema doesn't know about (e.g. counterAccountBankId/-Name/-Number, virtualAccountName/-Number —
// seen in PayOS's own examples but not exhaustively confirmed without live sandbox access). Zod
// object schemas silently *strip* unrecognized keys by default — without `.passthrough()` here,
// verification would reconstruct the signature from a smaller field set than PayOS actually signed,
// and every real webhook would fail signature verification. `.passthrough()` keeps whatever PayOS
// actually sends, so `verifyPayOSSignature` below signs the true full set — see
// payos-signature.util.spec.ts / payos.provider.spec.ts for a regression test.
const webhookPayloadSchema = z.object({
  code: z.string(),
  desc: z.string(),
  success: z.boolean(),
  signature: z.string().min(1),
  data: z
    .object({
      orderCode: z.number(),
      amount: z.number(),
      description: z.string(),
      reference: z.string(),
      currency: z.string(),
    })
    .passthrough(),
});

interface PayOSCreatePaymentLinkResponse {
  code: string;
  desc: string;
  data?: {
    checkoutUrl: string;
    paymentLinkId: string;
  };
}

/**
 * PayOS (https://payos.vn) — the one provider selected for Sprint 7 (see
 * docs/architecture/payment-foundation.md "Provider decision"). Plain `fetch` against PayOS's REST
 * API, no vendor SDK dependency — mirrors `OpenAIProvider`'s own "plain fetch, no SDK" precedent.
 *
 * `createPayment`'s network call is the only part ever short-circuited (via `mockCheckout`, gated
 * to non-production by `env.validation.ts`); `verifyWebhook`'s signature check is always real —
 * that is the one piece Phase 6 of the sprint brief calls "CRITICAL", and it is never mocked.
 */
export class PayOSProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'payos';
  private readonly logger = new Logger('PayOSProvider');

  constructor(private readonly config: PayOSConfig) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const signatureFields = {
      amount: input.amount,
      cancelUrl: input.cancelUrl,
      description: input.description,
      orderCode: input.orderCode,
      returnUrl: input.returnUrl,
    };
    const signature = signPayOSData(signatureFields, this.config.checksumKey);

    if (this.config.mockCheckout) {
      this.logger.log(`PAYOS_MOCK_CHECKOUT active — skipping real PayOS call for orderCode=${input.orderCode}`);
      return {
        checkoutUrl: `${this.config.baseUrl}/mock-checkout/${input.orderCode}`,
        providerPaymentLinkId: `mock-${input.orderCode}`,
      };
    }

    const response = await fetch(`${this.config.baseUrl}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.config.clientId,
        'x-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        orderCode: input.orderCode,
        amount: input.amount,
        description: input.description,
        cancelUrl: input.cancelUrl,
        returnUrl: input.returnUrl,
        signature,
      }),
    });

    const body = (await response.json()) as PayOSCreatePaymentLinkResponse;
    if (!response.ok || body.code !== '00' || !body.data) {
      throw new Error(`PayOS create-payment-link failed: code=${body.code} desc=${body.desc}`);
    }

    return { checkoutUrl: body.data.checkoutUrl, providerPaymentLinkId: body.data.paymentLinkId };
  }

  verifyWebhook(payload: unknown): VerifiedWebhookPayment {
    const parsed = webhookPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new PaymentProviderSignatureError('Webhook payload failed schema validation');
    }

    const { data, signature } = parsed.data;
    // PayOS signs the `data` object's own fields — see buildPayOSSignatureData docstring. This is
    // the one check that makes the whole webhook trustworthy; everything downstream depends on it.
    if (!verifyPayOSSignature(data as unknown as Record<string, unknown>, signature, this.config.checksumKey)) {
      throw new PaymentProviderSignatureError();
    }

    return {
      orderCode: data.orderCode,
      amount: data.amount,
      currency: data.currency,
      status: parsed.data.success && parsed.data.code === '00' ? 'PAID' : 'FAILED',
      reference: data.reference,
      description: data.description,
    };
  }
}

/** Exported for tests that need to hand-sign a fixture the same way a real PayOS webhook would be
 * signed, without depending on Nest DI or a live provider instance. */
export { buildPayOSSignatureData };
