import { validateEnv } from './env.validation';

const VALID_PRODUCTION_BASE: Record<string, string> = {
  NODE_ENV: 'production',
  API_BASE_URL: 'https://api.example.com',
  FRONTEND_URL: 'https://app.example.com',
  APP_PUBLIC_URL: 'https://app.example.com',
  CORS_ORIGINS: 'https://app.example.com',
  DATABASE_URL: 'postgresql://user:pass@host:5432/db',
  REDIS_URL: 'redis://host:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(40),
  JWT_REFRESH_SECRET: 'b'.repeat(40),
  CSRF_SECRET: 'c'.repeat(40),
  AUTH_COOKIE_DOMAIN: 'example.com',
  AUTH_COOKIE_SECURE: 'true',
  EMAIL_PROVIDER: 'resend',
  EMAIL_FROM: 'BeaconVie <no-reply@example.com>',
  RESEND_API_KEY: 'resend-test-key',
  DEFAULT_AI_PROVIDER: 'openai',
  OPENAI_API_KEY: 'sk-test',
  PAYOS_CLIENT_ID: 'payos-client-test',
  PAYOS_API_KEY: 'payos-api-key-test',
  PAYOS_CHECKSUM_KEY: 'payos-checksum-key-test',
};

describe('validateEnv — Companion Core Mock provider production rejection (Sprint 2B audit Finding 1)', () => {
  it('boots successfully with a valid real-provider production config', () => {
    expect(() => validateEnv({ ...VALID_PRODUCTION_BASE })).not.toThrow();
  });

  it('rejects DEFAULT_AI_PROVIDER=mock in production', () => {
    expect(() => validateEnv({ ...VALID_PRODUCTION_BASE, DEFAULT_AI_PROVIDER: 'mock' })).toThrow(/DEFAULT_AI_PROVIDER cannot be "mock"/);
  });

  it('rejects FALLBACK_PROVIDER=mock in production even when DEFAULT_AI_PROVIDER is a real provider', () => {
    expect(() => validateEnv({ ...VALID_PRODUCTION_BASE, FALLBACK_PROVIDER: 'mock' })).toThrow(/FALLBACK_PROVIDER cannot be "mock"/);
  });

  it('rejects AI_ENABLE_MOCK_PROVIDER=true in production, even with a valid real default provider', () => {
    expect(() => validateEnv({ ...VALID_PRODUCTION_BASE, AI_ENABLE_MOCK_PROVIDER: 'true' })).toThrow(/AI_ENABLE_MOCK_PROVIDER cannot be true/);
  });

  it('allows DEFAULT_AI_PROVIDER=mock outside production, with AI_ENABLE_MOCK_PROVIDER left at its default (false)', () => {
    const config = validateEnv({
      ...VALID_PRODUCTION_BASE,
      NODE_ENV: 'development',
      AUTH_COOKIE_SECURE: 'false',
      DEFAULT_AI_PROVIDER: 'mock',
      OPENAI_API_KEY: undefined as unknown as string,
    });
    expect(config.DEFAULT_AI_PROVIDER).toBe('mock');
    expect(config.AI_ENABLE_MOCK_PROVIDER).toBe(false);
  });

  it('defaults AI_ENABLE_MOCK_PROVIDER to false when unset', () => {
    const config = validateEnv({ ...VALID_PRODUCTION_BASE });
    expect(config.AI_ENABLE_MOCK_PROVIDER).toBe(false);
  });
});

function withoutKey(key: keyof typeof VALID_PRODUCTION_BASE): Record<string, string> {
  const rest = { ...VALID_PRODUCTION_BASE };
  delete rest[key];
  return rest;
}

describe('validateEnv — Premium & Payment Foundation (Sprint 7) production requirements', () => {
  it('rejects production boot when PAYOS_CLIENT_ID is missing', () => {
    expect(() => validateEnv(withoutKey('PAYOS_CLIENT_ID'))).toThrow(/PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY are all required/);
  });

  it('rejects production boot when PAYOS_API_KEY is missing', () => {
    expect(() => validateEnv(withoutKey('PAYOS_API_KEY'))).toThrow(/PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY are all required/);
  });

  it('rejects production boot when PAYOS_CHECKSUM_KEY is missing', () => {
    expect(() => validateEnv(withoutKey('PAYOS_CHECKSUM_KEY'))).toThrow(/PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY are all required/);
  });

  it('rejects PAYOS_MOCK_CHECKOUT=true in production', () => {
    expect(() => validateEnv({ ...VALID_PRODUCTION_BASE, PAYOS_MOCK_CHECKOUT: 'true' })).toThrow(/PAYOS_MOCK_CHECKOUT cannot be true in production/);
  });

  it('defaults PREMIUM_PRICE_VND/PREMIUM_DURATION_DAYS sensibly when unset', () => {
    const config = validateEnv({ ...VALID_PRODUCTION_BASE });
    expect(config.PREMIUM_PRICE_VND).toBe(79_000);
    expect(config.PREMIUM_DURATION_DAYS).toBe(30);
  });

  it('defaults PAYMENTS_ENABLED to true when unset (kill switch is opt-out, not opt-in)', () => {
    const config = validateEnv({ ...VALID_PRODUCTION_BASE });
    expect(config.PAYMENTS_ENABLED).toBe(true);
  });

  it('allows PAYMENTS_ENABLED=false in production (the kill switch itself must not be blocked), and it actually parses to false', () => {
    const config = validateEnv({ ...VALID_PRODUCTION_BASE, PAYMENTS_ENABLED: 'false' });
    expect(config.PAYMENTS_ENABLED).toBe(false);
  });
});

describe('validateEnv — Release Closure finding: boolean env vars must parse the string "false" as false, not coerce it to true', () => {
  // z.coerce.boolean() (the previous implementation) runs plain JS Boolean(x) coercion, which is
  // true for ANY non-empty string — including the literal string "false". Discovered live during
  // Sprint 12 release closure: PAYMENTS_ENABLED=false had zero effect on a running server. Also
  // confirmed silently active for AUTH_COOKIE_SECURE=false, explicitly set in both .env and
  // .env.test. These tests assert the actual parsed value, not merely "did validateEnv throw" —
  // the bug never threw, it silently produced the wrong boolean.
  it.each(['AUTH_COOKIE_SECURE', 'AI_ENABLE_MOCK_PROVIDER', 'PAYOS_MOCK_CHECKOUT', 'PAYMENTS_ENABLED'] as const)(
    '%s="false" parses to the boolean false, not true',
    (key) => {
      const config = validateEnv({ ...VALID_PRODUCTION_BASE, NODE_ENV: 'development', [key]: 'false' });
      expect(config[key]).toBe(false);
    },
  );

  it.each(['AUTH_COOKIE_SECURE', 'AI_ENABLE_MOCK_PROVIDER', 'PAYOS_MOCK_CHECKOUT', 'PAYMENTS_ENABLED'] as const)(
    '%s="true" parses to the boolean true',
    (key) => {
      const config = validateEnv({ ...VALID_PRODUCTION_BASE, NODE_ENV: 'development', [key]: 'true' });
      expect(config[key]).toBe(true);
    },
  );

  it.each(['AUTH_COOKIE_SECURE', 'AI_ENABLE_MOCK_PROVIDER', 'PAYOS_MOCK_CHECKOUT', 'PAYMENTS_ENABLED'] as const)(
    '%s is case-insensitive ("FALSE"/"True" style values still parse correctly)',
    (key) => {
      const falseish = validateEnv({ ...VALID_PRODUCTION_BASE, NODE_ENV: 'development', [key]: 'FALSE' });
      expect(falseish[key]).toBe(false);
      const trueish = validateEnv({ ...VALID_PRODUCTION_BASE, NODE_ENV: 'development', [key]: 'TRUE' });
      expect(trueish[key]).toBe(true);
    },
  );
});
