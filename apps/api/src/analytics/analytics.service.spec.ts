import { AnalyticsService } from './analytics.service';
import type { AnalyticsSink, AnalyticsCaptureEvent } from './sinks/analytics-sink.interface';

function makeService() {
  const captured: AnalyticsCaptureEvent[] = [];
  const sink: AnalyticsSink = { capture: jest.fn(async (event) => void captured.push(event)) };
  const service = new AnalyticsService(sink);
  return { service, sink, captured };
}

describe('AnalyticsService.trackClientEvents', () => {
  it('uses the authenticated userId as distinctId when present, ignoring the anonymousId', async () => {
    const { service, captured } = makeService();
    await service.trackClientEvents([{ event: 'landing_view', anonymousId: 'anon-1' }], 'user-1');
    expect(captured).toHaveLength(1);
    expect(captured[0]!.distinctId).toBe('user-1');
  });

  it('falls back to the anonymousId as distinctId when no user is authenticated', async () => {
    const { service, captured } = makeService();
    await service.trackClientEvents([{ event: 'landing_view', anonymousId: 'anon-1' }], null);
    expect(captured[0]!.distinctId).toBe('anon-1');
  });

  it('captures every event in a batch, preserving order', async () => {
    const { service, captured } = makeService();
    await service.trackClientEvents(
      [
        { event: 'landing_view', anonymousId: 'anon-1' },
        { event: 'discover_viewed', anonymousId: 'anon-1' },
      ],
      null,
    );
    expect(captured.map((e) => e.event)).toEqual(['landing_view', 'discover_viewed']);
  });

  it('strips the query string and hash from a route property, keeping only the pathname', async () => {
    const { service, captured } = makeService();
    await service.trackClientEvents(
      [{ event: 'discover_viewed', anonymousId: 'anon-1', properties: { route: '/premium?reason=locked&token=abc#section' } }],
      null,
    );
    expect(captured[0]!.properties.route).toBe('/premium');
  });

  it('never throws when the sink rejects — analytics failure must not propagate to the caller', async () => {
    const captured: AnalyticsCaptureEvent[] = [];
    const sink: AnalyticsSink = { capture: jest.fn(async () => { throw new Error('provider unreachable'); }) };
    const service = new AnalyticsService(sink);
    await expect(service.trackClientEvents([{ event: 'landing_view', anonymousId: 'anon-1' }], null)).resolves.toBeUndefined();
    expect(captured).toHaveLength(0);
  });
});

describe('AnalyticsService.trackServerEvent', () => {
  it('always uses the given userId as distinctId (server events are never anonymous)', async () => {
    const { service, captured } = makeService();
    await service.trackServerEvent({ event: 'payment_success', userId: 'user-1', properties: { feature: 'premium' } });
    expect(captured[0]).toMatchObject({ event: 'payment_success', distinctId: 'user-1', properties: { feature: 'premium' } });
  });

  it('never throws when the sink rejects', async () => {
    const sink: AnalyticsSink = { capture: jest.fn(async () => { throw new Error('boom'); }) };
    const service = new AnalyticsService(sink);
    await expect(service.trackServerEvent({ event: 'signup_completed', userId: 'user-1' })).resolves.toBeUndefined();
  });

  it('stamps a server receipt timestamp, never trusting client-supplied time', async () => {
    const { service, captured } = makeService();
    const before = Date.now();
    await service.trackServerEvent({ event: 'onboarding_completed', userId: 'user-1' });
    expect(captured[0]!.timestamp.getTime()).toBeGreaterThanOrEqual(before);
  });
});
