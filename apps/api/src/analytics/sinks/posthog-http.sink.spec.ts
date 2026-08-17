import { Logger } from '@nestjs/common';
import { PostHogHttpSink } from './posthog-http.sink';

describe('PostHogHttpSink', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('POSTs to {host}/i/v0/e with the api_key, event, distinct_id, properties, and an ISO timestamp', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as never;

    const sink = new PostHogHttpSink('phc_test_key', 'https://us.i.posthog.com');
    const timestamp = new Date('2026-08-17T10:00:00.000Z');
    await sink.capture({ event: 'landing_view', distinctId: 'anon-1', properties: { route: '/' }, timestamp });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://us.i.posthog.com/i/v0/e');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      api_key: 'phc_test_key',
      event: 'landing_view',
      distinct_id: 'anon-1',
      properties: { route: '/' },
      timestamp: '2026-08-17T10:00:00.000Z',
    });
  });

  it('never throws when the network request fails — logs and resolves', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as never;
    const sink = new PostHogHttpSink('phc_test_key', 'https://us.i.posthog.com');
    await expect(
      sink.capture({ event: 'landing_view', distinctId: 'anon-1', properties: {}, timestamp: new Date() }),
    ).resolves.toBeUndefined();
  });

  it('never throws when PostHog responds with a non-2xx status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as never;
    const sink = new PostHogHttpSink('phc_test_key', 'https://us.i.posthog.com');
    await expect(
      sink.capture({ event: 'landing_view', distinctId: 'anon-1', properties: {}, timestamp: new Date() }),
    ).resolves.toBeUndefined();
  });

  it('never logs event properties on failure (only the event name)', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as never;
    const sink = new PostHogHttpSink('phc_test_key', 'https://us.i.posthog.com');
    await sink.capture({
      event: 'landing_view',
      distinctId: 'anon-1',
      properties: { route: '/should-not-appear-in-logs' },
      timestamp: new Date(),
    });
    const loggedText = warnSpy.mock.calls.map((call) => String(call[0])).join(' ');
    expect(loggedText).not.toContain('should-not-appear-in-logs');
  });
});
