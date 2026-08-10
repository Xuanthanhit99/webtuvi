import { PayOSProvider } from './payos.provider';
import { PaymentProviderSignatureError } from './payment-provider.interface';
import { signPayOSData } from './payos-signature.util';

const CHECKSUM_KEY = 'test-checksum-key';

function baseConfig(overrides: Partial<ConstructorParameters<typeof PayOSProvider>[0]> = {}) {
  return {
    clientId: 'client-1',
    apiKey: 'api-key-1',
    checksumKey: CHECKSUM_KEY,
    baseUrl: 'https://api-merchant.payos.vn',
    mockCheckout: true,
    ...overrides,
  };
}

function signedWebhookPayload(overrides: Partial<{ orderCode: number; amount: number; currency: string; reference: string; description: string; success: boolean; code: string }> = {}) {
  const data = {
    orderCode: overrides.orderCode ?? 123456,
    amount: overrides.amount ?? 79000,
    description: overrides.description ?? 'BeaconVie Premium',
    reference: overrides.reference ?? 'FT2600001',
    currency: overrides.currency ?? 'VND',
  };
  const signature = signPayOSData(data, CHECKSUM_KEY);
  return {
    code: overrides.code ?? '00',
    desc: 'success',
    success: overrides.success ?? true,
    data,
    signature,
  };
}

describe('PayOSProvider.createPayment (mock mode)', () => {
  it('returns a deterministic checkout result without calling fetch when PAYOS_MOCK_CHECKOUT is on', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const provider = new PayOSProvider(baseConfig());
    const result = await provider.createPayment({
      orderCode: 999,
      amount: 79000,
      currency: 'VND',
      description: 'BeaconVie Premium',
      returnUrl: 'https://app.example.com/premium/return?order=abc',
      cancelUrl: 'https://app.example.com/premium?cancelled=1',
    });
    expect(result.checkoutUrl).toContain('999');
    expect(result.providerPaymentLinkId).toContain('999');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('PayOSProvider.createPayment (real network call)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('calls the PayOS create-payment-link endpoint and returns its checkoutUrl on success', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: '00', desc: 'success', data: { checkoutUrl: 'https://pay.payos.vn/web/abc', paymentLinkId: 'link-abc' } }),
    } as Response);

    const provider = new PayOSProvider(baseConfig({ mockCheckout: false }));
    const result = await provider.createPayment({
      orderCode: 1,
      amount: 79000,
      currency: 'VND',
      description: 'BeaconVie Premium',
      returnUrl: 'https://app.example.com/premium/return?order=abc',
      cancelUrl: 'https://app.example.com/premium?cancelled=1',
    });

    expect(result).toEqual({ checkoutUrl: 'https://pay.payos.vn/web/abc', providerPaymentLinkId: 'link-abc' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api-merchant.payos.vn/v2/payment-requests',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws if PayOS responds with a non-success code', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: '01', desc: 'invalid signature' }),
    } as Response);

    const provider = new PayOSProvider(baseConfig({ mockCheckout: false }));
    await expect(
      provider.createPayment({
        orderCode: 1,
        amount: 79000,
        currency: 'VND',
        description: 'x',
        returnUrl: 'https://a',
        cancelUrl: 'https://b',
      }),
    ).rejects.toThrow(/PayOS create-payment-link failed/);
  });
});

describe('PayOSProvider.verifyWebhook — the CRITICAL security check (Phase 6)', () => {
  it('accepts a correctly-signed, successful payment webhook and returns PAID', () => {
    const provider = new PayOSProvider(baseConfig());
    const result = provider.verifyWebhook(signedWebhookPayload());
    expect(result).toEqual({ orderCode: 123456, amount: 79000, currency: 'VND', status: 'PAID', reference: 'FT2600001', description: 'BeaconVie Premium' });
  });

  it('maps success:false to FAILED', () => {
    const provider = new PayOSProvider(baseConfig());
    const result = provider.verifyWebhook(signedWebhookPayload({ success: false, code: '01' }));
    expect(result.status).toBe('FAILED');
  });

  it('rejects a webhook signed with the wrong checksum key (forged webhook)', () => {
    const provider = new PayOSProvider(baseConfig({ checksumKey: CHECKSUM_KEY }));
    const forged = signedWebhookPayload();
    const wrongKeySignature = signPayOSData(forged.data, 'attacker-key');
    expect(() => provider.verifyWebhook({ ...forged, signature: wrongKeySignature })).toThrow(PaymentProviderSignatureError);
  });

  it('rejects a tampered amount even though the rest of the payload is otherwise well-formed', () => {
    const provider = new PayOSProvider(baseConfig());
    const payload = signedWebhookPayload();
    const tampered = { ...payload, data: { ...payload.data, amount: 1 } }; // signature no longer matches this amount
    expect(() => provider.verifyWebhook(tampered)).toThrow(PaymentProviderSignatureError);
  });

  it('rejects a malformed payload (missing required fields) without ever reaching the signature check', () => {
    const provider = new PayOSProvider(baseConfig());
    expect(() => provider.verifyWebhook({ not: 'a valid payos payload' })).toThrow(PaymentProviderSignatureError);
  });

  it('rejects a payload with no signature at all', () => {
    const provider = new PayOSProvider(baseConfig());
    const payload = signedWebhookPayload();
    const withoutSignature: Record<string, unknown> = { ...payload };
    delete withoutSignature.signature;
    expect(() => provider.verifyWebhook(withoutSignature)).toThrow(PaymentProviderSignatureError);
  });

  // Release Closure re-audit — payos.vn's own docs ("Kiểm tra dữ liệu với signature") state the
  // signature covers *every* field actually present in `data`, not a fixed allowlist. Before this
  // test was added, the zod schema silently stripped unrecognized fields, so a real PayOS webhook
  // carrying fields this codebase doesn't explicitly name (e.g. bank/virtual-account fields) would
  // have failed signature verification in production. This proves an extra, undeclared field is
  // correctly included in the signature check rather than silently dropped. Field set mirrors
  // payOS's own documented example payload verbatim (docs.payos.vn "Dữ liệu trả về > Webhook") —
  // orderCode/amount/description/accountNumber/reference/transactionDateTime/currency/
  // paymentLinkId/code/desc/counterAccountBankId/counterAccountBankName/counterAccountName/
  // counterAccountNumber/virtualAccountName/virtualAccountNumber.
  it('correctly verifies a webhook whose `data` object carries every field from payOS\'s own documented example payload', () => {
    const provider = new PayOSProvider(baseConfig());
    const data = {
      orderCode: 123,
      amount: 3000,
      description: 'VQRIO123',
      accountNumber: '12345678',
      reference: 'TF230204212323',
      transactionDateTime: '2023-02-04 18:25:00',
      currency: 'VND',
      paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
      code: '00',
      desc: 'Thành công',
      counterAccountBankId: '',
      counterAccountBankName: '',
      counterAccountName: '',
      counterAccountNumber: '',
      virtualAccountName: '',
      virtualAccountNumber: '',
    };
    const signature = signPayOSData(data, CHECKSUM_KEY); // signed over the FULL field set, as PayOS would
    const payload = { code: '00', desc: 'success', success: true, data, signature };

    const result = provider.verifyWebhook(payload);
    expect(result.orderCode).toBe(123);
    expect(result.reference).toBe('TF230204212323');
  });

  it('rejects a webhook if the extra fields were tampered with after signing (proves they are not ignored)', () => {
    const provider = new PayOSProvider(baseConfig());
    const data = {
      orderCode: 123456,
      amount: 79000,
      description: 'BeaconVie Premium',
      reference: 'FT2600001',
      currency: 'VND',
      counterAccountNumber: '0123456789',
    };
    const signature = signPayOSData(data, CHECKSUM_KEY);
    const tamperedPayload = { code: '00', desc: 'success', success: true, data: { ...data, counterAccountNumber: '9999999999' }, signature };
    expect(() => provider.verifyWebhook(tamperedPayload)).toThrow(PaymentProviderSignatureError);
  });
});
