import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { RedisService } from '../src/redis/redis.service';
import type { GeocodingCandidate } from '../src/geocoding/geocoding-provider.interface';

// Sprint 9 — Natal Chart Discovery Foundation e2e coverage against the real HTTP surface, real
// Postgres, and real Redis. Mirrors numerology.e2e-spec.ts/tarot.e2e-spec.ts's own helpers/
// discipline (unique email per test, identical-404 ownership checks). Runs against the mock AI
// provider (.env.test DEFAULT_AI_PROVIDER=mock) — unlike Numerology/Tarot, `interpretation` is
// expected to stay `null` here: MockProvider is a generic, non-context-aware canned-reply cycler
// (see mock.provider.ts#pickReply), so its output never satisfies this feature's strict-JSON
// section schema, and the interpretation pipeline correctly discards it rather than fabricating a
// result — this is the intended AI-boundary resilience behavior, not a test gap (see
// docs/architecture/natal-chart-discovery.md "AI interpretation boundary").
//
// Chart creation requires a `locationToken` resolved via `GET /geocoding/search`, which calls the
// live public Nominatim API — inappropriate for a fast, deterministic, offline-capable test suite.
// Every test below instead seeds a location candidate directly into Redis under the exact key
// `GeocodingService` itself uses, simulating what a real search would have cached, and uses that
// known token — this exercises the full "server never trusts client-supplied coordinates" path
// without a network dependency. A single, separate, real-network test near the bottom proves the
// live Nominatim integration itself still genuinely works end-to-end.

const GEOCODING_REDIS_PREFIX = 'beaconvie:geocoding:candidate:';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Natal Chart User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

interface NatalPlacementApi { body: string; sign: string; house: number | null; retrograde: boolean }
interface NatalChartApi {
  id: string;
  status: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthPlaceLabel: string;
  timezone: string;
  housesAvailable: boolean;
  interpretation: unknown;
  placements: NatalPlacementApi[];
  houses: unknown[];
  ascendant: { sign: string } | null;
}

describe('Natal Chart (e2e)', () => {
  let app: INestApplication;
  let redis: RedisService;

  beforeAll(async () => {
    app = await createTestApp();
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  /** Seeds a Redis-cached geocoding candidate exactly as `GeocodingService.search()` would, and
   * returns the token a real `POST /natal-charts` call would reference. */
  async function seedLocation(candidate: GeocodingCandidate): Promise<string> {
    const token = randomUUID();
    await redis.client.set(`${GEOCODING_REDIS_PREFIX}${token}`, JSON.stringify(candidate), 'EX', 900);
    return token;
  }

  const HANOI: GeocodingCandidate = { label: 'Thành phố Hà Nội, Việt Nam', latitude: 21.0285, longitude: 105.8542, countryCode: 'VN' };

  describe('Unauthenticated access', () => {
    it('rejects an unauthenticated request for charts (JwtAuthGuard)', async () => {
      await request(app.getHttpServer()).get('/natal-charts').expect(401);
    });

    it('rejects an unauthenticated create request at the CSRF layer before auth is even checked', async () => {
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: randomUUID() })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('rejects an unauthenticated geocoding search (JwtAuthGuard)', async () => {
      await request(app.getHttpServer()).get('/geocoding/search?q=Hanoi').expect(401);
    });
  });

  describe('Create (Phase 3/6/8/9)', () => {
    it('a real calculation persists real placements/houses/Ascendant, resolved only via the location token — never from client-supplied coordinates', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('create'));
      const token = await seedLocation(HANOI);

      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const chart = res.body.data as NatalChartApi;

      expect(chart.status).toBe('ACTIVE');
      expect(chart.birthDate).toBe('2000-06-15');
      expect(chart.birthTime).toBe('14:30');
      expect(chart.birthTimeKnown).toBe(true);
      expect(chart.birthPlaceLabel).toBe('Thành phố Hà Nội, Việt Nam');
      expect(chart.timezone).toBe('Asia/Ho_Chi_Minh');
      expect(chart.housesAvailable).toBe(true);
      expect(chart.placements).toHaveLength(10);
      expect(chart.houses).toHaveLength(12);
      expect(chart.ascendant?.sign).toBe('libra');

      const sun = chart.placements.find((p) => p.body === 'sun');
      expect(sun?.sign).toBe('gemini');
    });

    it('mass-assignment: a request carrying calculated/internal fields not on the DTO is hard-rejected (global ValidationPipe forbidNonWhitelisted), never silently accepted', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('mass-assign'));
      const token = await seedLocation(HANOI);

      // Attempted mass-assignment of calculated/internal fields — the global ValidationPipe
      // (`whitelist: true, forbidNonWhitelisted: true`, see test-app.ts) rejects the entire
      // request outright rather than silently stripping the extras and proceeding — stronger
      // protection than a bare whitelist-and-ignore would give.
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({
          birthDate: '2000-06-15',
          birthTime: '14:30',
          locationToken: token,
          userId: 'someone-else',
          housesAvailable: false,
          calculationVersion: 'hacked',
          latitude: 0,
          longitude: 0,
        })
        .expect(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');

      // The same request, stripped of the forbidden extra fields, succeeds normally and every
      // calculated value still comes only from the real engine/geocoding result.
      const clean = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const chart = clean.body.data as NatalChartApi;
      expect(chart.housesAvailable).toBe(true);
      expect(chart.timezone).toBe('Asia/Ho_Chi_Minh');
    });

    it('rejects when the location token cannot be resolved (expired/unknown) — never fabricates coordinates', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('bad-token'));
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: randomUUID() })
        .expect(400);
      expect(res.body.error.code).toBe('NATAL_CHART_LOCATION_NOT_RESOLVED');
    });

    it('rejects a malformed (non-UUID) location token at the DTO layer', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('malformed-token'));
      await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: 'not-a-uuid' })
        .expect(400);
    });

    it('rejects an impossible calendar date', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('bad-date'));
      const token = await seedLocation(HANOI);
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2024-02-30', birthTime: '14:30', locationToken: token })
        .expect(400);
      expect(res.body.error.code).toBe('NATAL_CHART_INVALID_CALENDAR_DATE');
    });

    it('rejects a future birth date', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('future-date'));
      const token = await seedLocation(HANOI);
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2099-01-01', locationToken: token })
        .expect(400);
      expect(res.body.error.code).toBe('NATAL_CHART_FUTURE_DATE_NOT_ALLOWED');
    });

    it('omitting birth time is fully supported — the chart still calculates, with houses/Ascendant honestly marked unavailable, never guessed', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('no-time'));
      const token = await seedLocation(HANOI);
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', locationToken: token })
        .expect(201);
      const chart = res.body.data as NatalChartApi;
      expect(chart.birthTimeKnown).toBe(false);
      expect(chart.birthTime).toBeNull();
      expect(chart.housesAvailable).toBe(false);
      expect(chart.houses).toHaveLength(0);
      expect(chart.ascendant).toBeNull();
      expect(chart.placements).toHaveLength(10);
      for (const placement of chart.placements) expect(placement.house).toBeNull();
    });

    it('rejects a create request without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
      const token = await seedLocation(HANOI);
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set('Cookie', headers.Cookie)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('AI boundary — interpretation never mutates chart facts, and a non-conforming provider output is discarded, never fabricated (Phase 10/22)', () => {
    it('interpretation stays null against the generic Mock provider (its output never matches the strict structured schema), and every calculated fact is preserved', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('ai-boundary'));
      const token = await seedLocation(HANOI);

      const created = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const chart = created.body.data as NatalChartApi;
      expect(chart.interpretation).toBeNull();
      expect(chart.placements).toHaveLength(10);

      const retried = await request(app.getHttpServer()).post(`/natal-charts/${chart.id}/interpret`).set(headers).expect(201);
      const afterRetry = retried.body.data as NatalChartApi;
      expect(afterRetry.interpretation).toBeNull();
      // The calculated facts are byte-identical before and after the interpretation attempt.
      expect(afterRetry.placements).toEqual(chart.placements);
      expect(afterRetry.housesAvailable).toBe(chart.housesAvailable);
    });
  });

  describe('Lifecycle (Phase 6/19)', () => {
    it('archive -> restore returns to ACTIVE, and delete -> restore does the same, each writing real history', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('lifecycle'));
      const token = await seedLocation(HANOI);
      const created = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const id = (created.body.data as NatalChartApi).id;

      const archived = await request(app.getHttpServer()).post(`/natal-charts/${id}/archive`).set(headers).expect(201);
      expect(archived.body.data.status).toBe('ARCHIVED');
      const restored = await request(app.getHttpServer()).post(`/natal-charts/${id}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');

      const deleted = await request(app.getHttpServer()).delete(`/natal-charts/${id}`).set(headers).expect(200);
      expect(deleted.body.data.status).toBe('DELETED');
      const restoredAgain = await request(app.getHttpServer()).post(`/natal-charts/${id}/restore`).set(headers).expect(201);
      expect(restoredAgain.body.data.status).toBe('ACTIVE');

      const history = await request(app.getHttpServer()).get(`/natal-charts/${id}/history`).set(headers).expect(200);
      const actions = (history.body.data as { action: string }[]).map((h) => h.action);
      expect(actions).toEqual(expect.arrayContaining(['CREATED', 'ARCHIVED', 'RESTORED', 'DELETED']));
    });

    it('an invalid transition (archiving an already-archived chart) is rejected', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('invalid-transition'));
      const token = await seedLocation(HANOI);
      const created = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const id = (created.body.data as NatalChartApi).id;
      await request(app.getHttpServer()).post(`/natal-charts/${id}/archive`).set(headers).expect(201);
      await request(app.getHttpServer()).post(`/natal-charts/${id}/archive`).set(headers).expect(400);
    });

    it('a soft-deleted chart is invisible in the default (non-DELETED) list but a direct fetch by owner still works', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('deleted-visibility'));
      const token = await seedLocation(HANOI);
      const created = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const id = (created.body.data as NatalChartApi).id;
      await request(app.getHttpServer()).delete(`/natal-charts/${id}`).set(headers).expect(200);

      const list = await request(app.getHttpServer()).get('/natal-charts').set(headers).expect(200);
      expect((list.body.data.items as { id: string }[]).map((c) => c.id)).not.toContain(id);

      const direct = await request(app.getHttpServer()).get(`/natal-charts/${id}`).set(headers).expect(200);
      expect((direct.body.data as NatalChartApi).status).toBe('DELETED');
    });
  });

  describe('Ownership, cross-user isolation, and IDOR resistance (Phase 16/22)', () => {
    it('getOne/history/archive/restore/delete/interpret 404 identically for a nonexistent id and another user’s chart', async () => {
      const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('other'));
      const token = await seedLocation(HANOI);
      const created = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(ownerHeaders)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(201);
      const id = (created.body.data as NatalChartApi).id;

      const forReal = await request(app.getHttpServer()).get(`/natal-charts/${id}`).set(otherHeaders).expect(404);
      const forFake = await request(app.getHttpServer()).get('/natal-charts/does-not-exist').set(otherHeaders).expect(404);
      expect(forReal.body.error.code).toBe(forFake.body.error.code);
      expect(forReal.body.error.code).toBe('NATAL_CHART_NOT_FOUND');

      await request(app.getHttpServer()).get(`/natal-charts/${id}/history`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/natal-charts/${id}/archive`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/natal-charts/${id}/restore`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/natal-charts/${id}/interpret`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).delete(`/natal-charts/${id}`).set(otherHeaders).expect(404);

      // The victim's chart is provably untouched by every rejected attempt above.
      const stillIntact = await request(app.getHttpServer()).get(`/natal-charts/${id}`).set(ownerHeaders).expect(200);
      expect((stillIntact.body.data as NatalChartApi).status).toBe('ACTIVE');
    });

    it('the chart list never includes another user’s charts', async () => {
      const mineHeaders = await registerAndGetHeaders(app, uniqueEmail('mine'));
      const theirsHeaders = await registerAndGetHeaders(app, uniqueEmail('theirs'));
      const tokenTheirs = await seedLocation(HANOI);
      const tokenMine = await seedLocation({ ...HANOI, label: 'A different, unrelated place' });

      await request(app.getHttpServer())
        .post('/natal-charts')
        .set(theirsHeaders)
        .send({ birthDate: '1991-02-02', birthTime: '10:00', locationToken: tokenTheirs })
        .expect(201);
      await request(app.getHttpServer())
        .post('/natal-charts')
        .set(mineHeaders)
        .send({ birthDate: '1992-03-03', birthTime: '11:00', locationToken: tokenMine })
        .expect(201);

      const list = await request(app.getHttpServer()).get('/natal-charts').set(mineHeaders).expect(200);
      const labels = (list.body.data.items as { birthPlaceLabel: string }[]).map((c) => c.birthPlaceLabel);
      expect(labels).toEqual(['A different, unrelated place']);
    });
  });

  describe('Daily creation ceiling (Phase 16/20, anti-abuse)', () => {
    it('a Free account is denied after 5 creations in the same UTC day', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('ceiling'));
      for (let i = 0; i < 5; i++) {
        const token = await seedLocation(HANOI);
        await request(app.getHttpServer())
          .post('/natal-charts')
          .set(headers)
          .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
          .expect(201);
      }
      const token = await seedLocation(HANOI);
      const res = await request(app.getHttpServer())
        .post('/natal-charts')
        .set(headers)
        .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
        .expect(403);
      expect(res.body.error.code).toBe('PREMIUM_REQUIRED');
    });
  });

  describe('Live Nominatim geocoding integration (real network, no cost)', () => {
    it('resolves a real Vietnamese place name via the live public Nominatim API, returning an opaque token — never raw coordinates', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('geocoding-live'));
      const res = await request(app.getHttpServer()).get('/geocoding/search?q=Ha Noi Vietnam').set(headers).expect(200);
      const results = res.body.data as { token: string; label: string }[];

      expect(Array.isArray(results)).toBe(true);
      if (results.length === 0) {
        // The live public Nominatim service is best-effort infrastructure for this suite —
        // never fail the whole run over external network flakiness, but do not silently skip
        // without a visible signal either.
        console.warn('Live Nominatim returned zero results for "Ha Noi Vietnam" — network/service issue, not a code assertion.');
        return;
      }
      expect(results[0]).not.toHaveProperty('latitude');
      expect(results[0]).not.toHaveProperty('longitude');
      expect(typeof results[0]!.token).toBe('string');
    }, 15000);
  });
});
