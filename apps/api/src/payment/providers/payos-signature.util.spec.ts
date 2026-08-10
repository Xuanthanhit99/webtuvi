import { buildPayOSSignatureData, generateOrderCode, signPayOSData, verifyPayOSSignature } from './payos-signature.util';

describe('PayOS signature scheme (buildPayOSSignatureData/sign/verify)', () => {
  it('sorts keys alphabetically and joins as key=value&key=value', () => {
    const data = { orderCode: 123, amount: 79000, description: 'BeaconVie Premium' };
    expect(buildPayOSSignatureData(data)).toBe('amount=79000&description=BeaconVie Premium&orderCode=123');
  });

  it('renders null/undefined as an empty string, never the literal "null"/"undefined"', () => {
    expect(buildPayOSSignatureData({ a: null, b: undefined })).toBe('a=&b=');
  });

  it('sign() is deterministic for the same data + key', () => {
    const data = { orderCode: 1, amount: 100 };
    expect(signPayOSData(data, 'key1')).toBe(signPayOSData(data, 'key1'));
  });

  it('sign() differs for a different checksum key (a forged webhook without the real key cannot reproduce it)', () => {
    const data = { orderCode: 1, amount: 100 };
    expect(signPayOSData(data, 'key1')).not.toBe(signPayOSData(data, 'key2'));
  });

  it('verifyPayOSSignature accepts a correctly-signed payload', () => {
    const data = { orderCode: 42, amount: 79000, reference: 'FT2600001', currency: 'VND' };
    const signature = signPayOSData(data, 'real-checksum-key');
    expect(verifyPayOSSignature(data, signature, 'real-checksum-key')).toBe(true);
  });

  it('verifyPayOSSignature rejects a forged signature (wrong key)', () => {
    const data = { orderCode: 42, amount: 79000 };
    const forged = signPayOSData(data, 'attacker-guessed-key');
    expect(verifyPayOSSignature(data, forged, 'real-checksum-key')).toBe(false);
  });

  it('verifyPayOSSignature rejects a tampered amount even with the original signature', () => {
    const original = { orderCode: 42, amount: 79000 };
    const signature = signPayOSData(original, 'real-checksum-key');
    const tampered = { orderCode: 42, amount: 1 };
    expect(verifyPayOSSignature(tampered, signature, 'real-checksum-key')).toBe(false);
  });

  it('verifyPayOSSignature rejects a signature of the wrong length instead of throwing', () => {
    expect(verifyPayOSSignature({ a: 1 }, 'not-hex-and-too-short', 'key')).toBe(false);
  });

  it('generateOrderCode returns a positive safe integer, distinct across calls', () => {
    const a = generateOrderCode();
    const b = generateOrderCode();
    expect(Number.isSafeInteger(a)).toBe(true);
    expect(a).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});
