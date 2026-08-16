import type { ErrorEvent } from '@sentry/nextjs';
import { scrubSentryEvent } from './sentry-scrub';

function baseEvent(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return { message: 'Something broke', ...overrides } as ErrorEvent;
}

describe('scrubSentryEvent', () => {
  it('strips request body/cookies/query string entirely, regardless of content', () => {
    const event = baseEvent({
      request: {
        url: 'https://app.example.com/discover/tarot',
        data: { question: 'Will I get the job?', password: 'hunter2' },
        cookies: { beaconvie_access_token: 'jwt-value' },
        query_string: 'token=abc123',
      },
    });

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.query_string).toBeUndefined();
  });

  it('allowlists only known-safe request headers', () => {
    const event = baseEvent({
      request: {
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer secret-jwt',
          cookie: 'beaconvie_access_token=abc',
        },
      },
    });

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.request?.headers).toEqual({ 'content-type': 'application/json' });
  });

  it('never attaches user email/username/ip_address', () => {
    const event = baseEvent({ user: { id: 'user-123', email: 'real.person@example.com' } });
    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.user?.id).toBe('user-123');
    expect(scrubbed.user?.email).toBeUndefined();
  });

  it('redacts anything not on the metadata allowlist inside event.extra, recursively — only known-safe operational keys survive', () => {
    const event = baseEvent({
      extra: { requestId: 'req-abc', journalContent: 'private thoughts', feature: 'tarot' },
    });

    const scrubbed = scrubSentryEvent(event);

    const extra = scrubbed.extra as Record<string, unknown>;
    expect(extra.requestId).toBe('req-abc');
    expect(extra.feature).toBe('tarot');
    expect(extra.journalContent).toBe('[Redacted]');
  });

  it('Release Closure attack test: a sensitive value under an UNANTICIPATED, innocuous key name is still redacted — proves this is an allowlist, not a denylist', () => {
    const event = baseEvent({
      extra: {
        details: 'SENTINEL_TAROT_QUESTION_123',
        notes: 'SENTINEL_BIRTH_NAME_123',
        misc: ['SENTINEL_AI_PROMPT_123'],
      },
    });

    const scrubbed = scrubSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);

    expect(serialized).not.toContain('SENTINEL_TAROT_QUESTION_123');
    expect(serialized).not.toContain('SENTINEL_BIRTH_NAME_123');
    expect(serialized).not.toContain('SENTINEL_AI_PROMPT_123');
  });

  it('never touches the top-level error message', () => {
    const event = baseEvent({ message: 'TypeError: Cannot read property of undefined' });
    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.message).toBe('TypeError: Cannot read property of undefined');
  });

  it('handles an event with no optional fields without throwing', () => {
    expect(() => scrubSentryEvent(baseEvent())).not.toThrow();
  });
});
