import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, extractCookie } from './utils/test-app';

// Sprint 13 — Product Analytics Foundation. Exercises the real HTTP contract of the one public
// analytics endpoint: privacy allowlist enforcement (global ValidationPipe's
// whitelist/forbidNonWhitelisted), the client/server event-name split (a client can never submit a
// server-only event name like `payment_success`), anonymous + authenticated access, and the batch
// size cap. `NODE_ENV=test` forces the Noop sink (see AnalyticsModule's sink factory) — this suite
// never makes a real network call, and has no way to observe sink delivery, only the HTTP contract.

const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe('Analytics (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a batch of client-allowed events from an anonymous visitor (no auth, no CSRF header)', async () => {
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({
        events: [
          { event: 'landing_view', anonymousId: randomUUID() },
          { event: 'discover_viewed', anonymousId: randomUUID(), properties: { feature: 'discover', route: '/discover' } },
        ],
      })
      .expect(204);
  });

  it('accepts events from an authenticated visitor, identity resolved server-side from the session cookie', async () => {
    const email = uniqueEmail('analytics');
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Analytics User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
      .expect(201);
    const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;

    await request(app.getHttpServer())
      .post('/analytics/events')
      .set('Cookie', accessCookie)
      .send({ events: [{ event: 'dashboard_viewed', anonymousId: randomUUID() }] })
      .expect(204);
  });

  it('rejects a server-only event name — a client can never spoof payment_success or similar', async () => {
    const res = await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ events: [{ event: 'payment_success', anonymousId: randomUUID() }] })
      .expect(400);
    expect(res.body.error.code).toBeDefined();
  });

  it('rejects a property not in the allowlist (forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({
        events: [{ event: 'landing_view', anonymousId: randomUUID(), properties: { email: 'someone@example.com' } }],
      })
      .expect(400);
  });

  it('rejects a non-UUID anonymousId', async () => {
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ events: [{ event: 'landing_view', anonymousId: 'not-a-uuid' }] })
      .expect(400);
  });

  it('rejects an empty events array', async () => {
    await request(app.getHttpServer()).post('/analytics/events').send({ events: [] }).expect(400);
  });

  it('rejects a batch larger than the cap', async () => {
    const events = Array.from({ length: 21 }, () => ({ event: 'landing_view', anonymousId: randomUUID() }));
    await request(app.getHttpServer()).post('/analytics/events').send({ events }).expect(400);
  });

  it('strips the route query string server-side even though the DTO would accept the raw string', async () => {
    // Not directly observable via HTTP (the endpoint returns 204 with no body either way) — this
    // confirms the request that WOULD carry a query string is still accepted (i.e. sanitization
    // happens after validation, not as a validation rejection), complementing
    // AnalyticsService.spec.ts's direct unit coverage of the actual stripping behavior.
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ events: [{ event: 'discover_viewed', anonymousId: randomUUID(), properties: { route: '/discover?ref=email' } }] })
      .expect(204);
  });

  // Release-closure privacy attack test: the contract must function as an allowlist (only these
  // exact properties can ever be expressed), not a blacklist (reject known-bad names) — a
  // blacklist misses whatever it didn't anticipate. Every sentinel below targets a distinct kind
  // of PII/content this product handles elsewhere (auth, birth data, Tarot, Journal, Memory,
  // Companion) and must be rejected by the same `forbidNonWhitelisted` mechanism already proven
  // above, regardless of which property key or nesting shape it's smuggled under.
  describe('privacy attack test — sentinel values must never reach the allowlist', () => {
    const SENTINEL_EMAIL = 'sentinel-attack@example.com';
    const SENTINEL_NAME = 'Sentinel Attack Name';
    const SENTINEL_BIRTH_DATE = '1990-01-01';
    const SENTINEL_BIRTH_TIME = '13:37';
    const SENTINEL_LOCATION = 'Sentinel City, Nowhere';
    const SENTINEL_TAROT_QUESTION = 'Will the sentinel get the job?';
    const SENTINEL_JOURNAL = 'Dear diary, this is sentinel journal content.';
    const SENTINEL_MEMORY = 'The user once mentioned a sentinel fact about themselves.';
    const SENTINEL_AI_PROMPT = 'You are a helpful sentinel assistant.';
    const SENTINEL_AI_RESPONSE = 'Here is a sentinel AI-generated response.';
    const SENTINEL_TOKEN = 'sentinel-jwt-or-csrf-token-value';

    const attackPayloads: Array<{ label: string; properties: Record<string, unknown> }> = [
      { label: 'email as a bare property', properties: { email: SENTINEL_EMAIL } },
      { label: 'email under an allowlisted-sounding key', properties: { source: SENTINEL_EMAIL, userEmail: SENTINEL_EMAIL } },
      { label: 'display name', properties: { name: SENTINEL_NAME, displayName: SENTINEL_NAME } },
      { label: 'birth date', properties: { birthDate: SENTINEL_BIRTH_DATE } },
      { label: 'birth time', properties: { birthTime: SENTINEL_BIRTH_TIME } },
      { label: 'birth location', properties: { birthPlace: SENTINEL_LOCATION, location: SENTINEL_LOCATION } },
      { label: 'Tarot question text', properties: { question: SENTINEL_TAROT_QUESTION, tarotQuestion: SENTINEL_TAROT_QUESTION } },
      { label: 'Journal content', properties: { journalContent: SENTINEL_JOURNAL, content: SENTINEL_JOURNAL } },
      { label: 'Memory content', properties: { memoryContent: SENTINEL_MEMORY, summary: SENTINEL_MEMORY } },
      { label: 'AI prompt', properties: { prompt: SENTINEL_AI_PROMPT, systemPrompt: SENTINEL_AI_PROMPT } },
      { label: 'AI response', properties: { response: SENTINEL_AI_RESPONSE, interpretation: SENTINEL_AI_RESPONSE } },
      { label: 'auth/session token', properties: { token: SENTINEL_TOKEN, accessToken: SENTINEL_TOKEN, csrfToken: SENTINEL_TOKEN } },
      {
        label: 'nested object smuggling PII inside an otherwise-allowlisted property',
        properties: { feature: { name: 'tarot', userEmail: SENTINEL_EMAIL } as unknown as string },
      },
      {
        label: 'array of sentinel values under an unrecognized key',
        properties: { extra: [SENTINEL_EMAIL, SENTINEL_AI_RESPONSE] as unknown as string },
      },
      {
        label: 'valid allowlisted key alongside one sentinel key in the same object',
        properties: { feature: 'tarot', birthDate: SENTINEL_BIRTH_DATE },
      },
    ];

    it.each(attackPayloads)('rejects: $label', async ({ properties }) => {
      const res = await request(app.getHttpServer())
        .post('/analytics/events')
        .send({ events: [{ event: 'landing_view', anonymousId: randomUUID(), properties }] });

      expect(res.status).toBe(400);
      // Belt-and-braces: even on an unexpected non-400 status, the raw response body must never
      // echo a sentinel value back (would indicate the payload was accepted/reflected somewhere).
      const raw = JSON.stringify(res.body);
      for (const sentinel of [
        SENTINEL_EMAIL,
        SENTINEL_NAME,
        SENTINEL_BIRTH_DATE,
        SENTINEL_BIRTH_TIME,
        SENTINEL_LOCATION,
        SENTINEL_TAROT_QUESTION,
        SENTINEL_JOURNAL,
        SENTINEL_MEMORY,
        SENTINEL_AI_PROMPT,
        SENTINEL_AI_RESPONSE,
        SENTINEL_TOKEN,
      ]) {
        expect(raw).not.toContain(sentinel);
      }
    });

    it('a request mixing one valid event and one attack event rejects the whole batch (no partial acceptance)', async () => {
      const res = await request(app.getHttpServer())
        .post('/analytics/events')
        .send({
          events: [
            { event: 'landing_view', anonymousId: randomUUID() },
            { event: 'landing_view', anonymousId: randomUUID(), properties: { email: SENTINEL_EMAIL } },
          ],
        });
      expect(res.status).toBe(400);
    });
  });
});
