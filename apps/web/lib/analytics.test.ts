import { resetAnonymousId, trackEvent } from './analytics';

const ANON_ID_KEY = 'bv_anon_id';

describe('trackEvent', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null,
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
  });

  it('POSTs a single-event batch to /analytics/events with a generated anonymousId', async () => {
    trackEvent('landing_view');
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/analytics/events');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].event).toBe('landing_view');
    expect(typeof body.events[0].anonymousId).toBe('string');
    expect(body.events[0].anonymousId.length).toBeGreaterThan(0);
  });

  it('reuses the same anonymousId across calls (persisted in localStorage)', async () => {
    trackEvent('landing_view');
    await Promise.resolve();
    await Promise.resolve();
    trackEvent('discover_viewed');
    await Promise.resolve();
    await Promise.resolve();

    const calls = (global.fetch as jest.Mock).mock.calls;
    const firstId = JSON.parse(calls[0][1].body).events[0].anonymousId;
    const secondId = JSON.parse(calls[1][1].body).events[0].anonymousId;
    expect(secondId).toBe(firstId);
    expect(window.localStorage.getItem(ANON_ID_KEY)).toBe(firstId);
  });

  it('passes through the given properties unchanged', async () => {
    trackEvent('tarot_started', { feature: 'tarot', spreadType: 'single_card' });
    await Promise.resolve();
    await Promise.resolve();

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.events[0].properties).toEqual({ feature: 'tarot', spreadType: 'single_card' });
  });

  it('never throws when the network request rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    expect(() => trackEvent('landing_view')).not.toThrow();
  });

  it('never throws even when fetch itself is unavailable (not just rejecting) — a caller mid-click-handler must never see an exception', () => {
    // @ts-expect-error — deliberately simulating an environment where `fetch` isn't a function at
    // all (e.g. an unmocked jsdom test), not merely a rejected promise.
    global.fetch = undefined;
    expect(() => trackEvent('tarot_interpretation_requested', { feature: 'tarot' })).not.toThrow();
  });

  it('does nothing when NEXT_PUBLIC_ANALYTICS_ENABLED is exactly "false"', async () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'false';
    trackEvent('landing_view');
    await Promise.resolve();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('resetAnonymousId (Sprint 13 Release Closure §21 — logout identity isolation)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('a browser reused after logout gets a fresh anonymousId, never the previous account-holder’s', async () => {
    trackEvent('landing_view');
    await Promise.resolve();
    await Promise.resolve();
    const userAAnonymousId = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).events[0].anonymousId;

    resetAnonymousId();

    trackEvent('landing_view');
    await Promise.resolve();
    await Promise.resolve();
    const nextVisitorAnonymousId = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body).events[0].anonymousId;

    expect(nextVisitorAnonymousId).not.toBe(userAAnonymousId);
  });

  it('never throws when storage is unavailable', () => {
    const original = window.localStorage.removeItem;
    window.localStorage.removeItem = () => {
      throw new Error('storage disabled');
    };
    expect(() => resetAnonymousId()).not.toThrow();
    window.localStorage.removeItem = original;
  });
});
