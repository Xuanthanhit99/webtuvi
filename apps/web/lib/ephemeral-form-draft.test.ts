import { clearEphemeralDraft, saveEphemeralDraft, takeEphemeralDraft } from './ephemeral-form-draft';

const KEY = 'test:ephemeral-draft';
const valid = (value: unknown): value is { text: string } =>
  !!value && typeof value === 'object' && typeof (value as { text?: unknown }).text === 'string';

describe('ephemeral form draft', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useRealTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('restores once and removes stored data immediately', () => {
    saveEphemeralDraft(KEY, { text: 'draft' }, 600_000);
    expect(takeEphemeralDraft(KEY, valid)).toEqual({ text: 'draft' });
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(takeEphemeralDraft(KEY, valid)).toBeNull();
  });

  it('discards expired drafts', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    saveEphemeralDraft(KEY, { text: 'old' }, 600_000);
    jest.advanceTimersByTime(600_001);
    expect(takeEphemeralDraft(KEY, valid)).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('discards invalid and malformed drafts', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ value: { invalid: true }, expiresAt: Date.now() + 1000 }));
    expect(takeEphemeralDraft(KEY, valid)).toBeNull();
    sessionStorage.setItem(KEY, 'invalid-json');
    expect(takeEphemeralDraft(KEY, valid)).toBeNull();
  });

  it('does not crash when storage is blocked', () => {
    const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      expect(() => saveEphemeralDraft(KEY, { text: 'draft' }, 600_000)).not.toThrow();
      expect(takeEphemeralDraft(KEY, valid)).toBeNull();
      expect(() => clearEphemeralDraft(KEY)).not.toThrow();
    } finally {
      get.mockRestore(); set.mockRestore(); remove.mockRestore();
    }
  });
});
