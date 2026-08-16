import type { ErrorEvent } from '@sentry/nestjs';
import { scrubSentryEvent } from './sentry-scrub.util';

function baseEvent(overrides: Partial<ErrorEvent> = {}): ErrorEvent {
  return { message: 'Something broke', ...overrides } as ErrorEvent;
}

describe('scrubSentryEvent', () => {
  it('strips request body/cookies/query string entirely, never sending them regardless of content', () => {
    const event = baseEvent({
      request: {
        url: 'https://api.example.com/tarot/readings/r1/interpret',
        method: 'POST',
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

  it('allowlists only known-safe request headers, dropping Authorization/Cookie/X-CSRF-Token', () => {
    const event = baseEvent({
      request: {
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0',
          authorization: 'Bearer secret-jwt',
          cookie: 'beaconvie_access_token=abc',
          'x-csrf-token': 'csrf-secret',
        },
      },
    });

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.request?.headers).toEqual({ 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' });
    expect(scrubbed.request?.headers).not.toHaveProperty('authorization');
    expect(scrubbed.request?.headers).not.toHaveProperty('cookie');
    expect(scrubbed.request?.headers).not.toHaveProperty('x-csrf-token');
  });

  it('never attaches user email/username/ip_address, even if a call site set them', () => {
    const event = baseEvent({ user: { id: 'user-123', email: 'real.person@example.com', username: 'realperson', ip_address: '1.2.3.4' } });

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.user?.id).toBe('user-123'); // opaque id is fine to keep
    expect(scrubbed.user?.email).toBeUndefined();
    expect(scrubbed.user?.username).toBeUndefined();
    expect(scrubbed.user?.ip_address).toBeUndefined();
  });

  it('redacts anything not on the metadata allowlist inside event.extra, recursively — only known-safe operational keys survive', () => {
    const event = baseEvent({
      extra: {
        requestId: 'req-abc',
        journalContent: 'Today I felt anxious about work.',
        birthNameInput: 'Nguyen Van A',
        nested: { authorizationHeader: 'Bearer xyz', sourceId: 'reading-1' },
      },
    });

    const scrubbed = scrubSentryEvent(event);

    const extra = scrubbed.extra as Record<string, unknown>;
    expect(extra.requestId).toBe('req-abc');
    expect(extra.journalContent).toBe('[Redacted]');
    expect(extra.birthNameInput).toBe('[Redacted]');
    // "nested" itself is not an allowlisted key, so the whole subtree is redacted — an
    // unrecognized wrapper key hides everything beneath it, which is the safer failure mode.
    expect(extra.nested).toBe('[Redacted]');
  });

  it('redacts anything not on the metadata allowlist inside contexts objects', () => {
    const event = baseEvent({ contexts: { payment: { checksumKey: 'real-checksum', orderId: 'order-1' } } });

    const scrubbed = scrubSentryEvent(event);

    const payment = scrubbed.contexts?.payment as Record<string, unknown>;
    expect(payment.checksumKey).toBe('[Redacted]');
    expect(payment.orderId).toBe('order-1');
  });

  it('Release Closure attack test: a sensitive value under an UNANTICIPATED, innocuous key name (not matching any denylist pattern) is still redacted — proves this is an allowlist, not a denylist, so no key name can ever bypass it', () => {
    const event = baseEvent({
      extra: {
        details: 'SENTINEL_TAROT_QUESTION_123 was asked about the future',
        notes: 'user said SENTINEL_BIRTH_NAME_123',
        misc: ['SENTINEL_AI_PROMPT_123', 'ordinary value'],
        freeformDebugBlob: { anythingAtAll: 'SENTINEL_MEMORY_123' },
      },
    });

    const scrubbed = scrubSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);

    expect(serialized).not.toContain('SENTINEL_TAROT_QUESTION_123');
    expect(serialized).not.toContain('SENTINEL_BIRTH_NAME_123');
    expect(serialized).not.toContain('SENTINEL_AI_PROMPT_123');
    expect(serialized).not.toContain('SENTINEL_MEMORY_123');
    const extra = scrubbed.extra as Record<string, unknown>;
    expect(extra.details).toBe('[Redacted]');
    expect(extra.notes).toBe('[Redacted]');
    expect(extra.misc).toBe('[Redacted]');
    expect(extra.freeformDebugBlob).toBe('[Redacted]');
  });

  it('redacts sensitive keys inside breadcrumb data without dropping the breadcrumb itself', () => {
    const event = baseEvent({
      breadcrumbs: [{ category: 'ai', message: 'provider call', data: { aiPromptText: 'system prompt here', provider: 'gemini' } }],
    });

    const scrubbed = scrubSentryEvent(event);

    const breadcrumb = scrubbed.breadcrumbs![0]!;
    expect((breadcrumb.data as Record<string, unknown>).aiPromptText).toBe('[Redacted]');
    expect((breadcrumb.data as Record<string, unknown>).provider).toBe('gemini');
    expect(breadcrumb.category).toBe('ai'); // breadcrumb structure itself is preserved
  });

  it('never touches the top-level error message/exception — that is the entire point of error tracking', () => {
    const event = baseEvent({
      message: 'TypeError: Cannot read property of undefined',
      exception: { values: [{ type: 'TypeError', value: 'Cannot read property of undefined' }] },
    });

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed.message).toBe('TypeError: Cannot read property of undefined');
    expect(scrubbed.exception?.values?.[0]?.value).toBe('Cannot read property of undefined');
  });

  it('handles an event with none of the optional fields present without throwing', () => {
    const event = baseEvent();
    expect(() => scrubSentryEvent(event)).not.toThrow();
  });

  it('Release Closure full sentinel attack test: an adversarial event with a sentinel value in every location the Sprint 12 brief named leaks none of them', () => {
    const event = baseEvent({
      request: {
        url: 'https://api.example.com/tarot/readings/r1/interpret',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer SENTINEL_COOKIE_123',
          cookie: 'beaconvie_access_token=SENTINEL_COOKIE_123',
          'x-csrf-token': 'SENTINEL_CSRF_123',
        },
        cookies: { beaconvie_access_token: 'SENTINEL_COOKIE_123' },
        query_string: 'token=SENTINEL_CSRF_123',
        data: {
          password: 'SENTINEL_PASSWORD_123',
          question: 'SENTINEL_TAROT_QUESTION_123',
          birthNameInput: 'SENTINEL_BIRTH_NAME_123',
          birthPlaceLabel: 'SENTINEL_BIRTH_LOCATION_123',
        },
      },
      user: { id: 'user-1', email: 'SENTINEL_EMAIL@example.com', username: 'SENTINEL_USERNAME', ip_address: '1.2.3.4' },
      extra: {
        requestBody: {
          question: 'SENTINEL_TAROT_QUESTION_123',
          memoryContent: 'SENTINEL_MEMORY_123',
          aiPrompt: 'SENTINEL_AI_PROMPT_123',
          nested: { deeper: { authorizationHeader: 'SENTINEL_COOKIE_123', birthName: 'SENTINEL_BIRTH_NAME_123' } },
        },
      },
      contexts: {
        payment: { checksumKey: 'SENTINEL_COOKIE_123' },
        ai: { promptText: 'SENTINEL_AI_PROMPT_123', response: 'SENTINEL_AI_PROMPT_123' },
      },
      breadcrumbs: [
        { category: 'http', message: 'request', data: { cookie: 'SENTINEL_COOKIE_123', question: 'SENTINEL_TAROT_QUESTION_123' } },
        { category: 'ai', message: 'companion message', data: { messageContent: 'SENTINEL_MEMORY_123' } },
      ],
    });

    const scrubbed = scrubSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);

    const sentinels = [
      'SENTINEL_PASSWORD_123',
      'SENTINEL_COOKIE_123',
      'SENTINEL_CSRF_123',
      'SENTINEL_TAROT_QUESTION_123',
      'SENTINEL_MEMORY_123',
      'SENTINEL_BIRTH_NAME_123',
      'SENTINEL_BIRTH_LOCATION_123',
      'SENTINEL_AI_PROMPT_123',
      'SENTINEL_EMAIL',
      'SENTINEL_USERNAME',
    ];
    for (const sentinel of sentinels) {
      expect(serialized).not.toContain(sentinel);
    }
  });
});
