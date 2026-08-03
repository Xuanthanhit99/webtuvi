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
