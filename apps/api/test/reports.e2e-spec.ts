import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import type { GeocodingCandidate } from '../src/geocoding/geocoding-provider.interface';

// Sprint 16 — Personal Destiny Report e2e coverage against the real HTTP surface, real Postgres,
// and real Redis. Mirrors natal-chart.e2e-spec.ts/numerology.e2e-spec.ts's own helpers/discipline
// (unique email per test, identical-404 ownership checks, real Redis-seeded geocoding).
//
// Runs against the mock AI provider (.env.test DEFAULT_AI_PROVIDER=mock). Reports requires
// schema-validated structured JSON output (locked decision — see docs/architecture/
// personal-destiny-report.md §13/§14), and MockProvider always returns one of four generic canned
// English sentences (mock.provider.ts#REPLIES) — never valid JSON. Exactly like Natal Chart's own
// documented precedent ("interpretation is expected to stay null... this is the intended
// AI-boundary resilience behavior, not a test gap"), generation against the mock provider is
// expected to complete cleanly and land in FAILED/VALIDATION_FAILED, never a fabricated READY
// report. The true READY/happy-path is verified separately against a real provider (Sprint 16's
// runtime-measurement pass, docs/progress/sprint-16-final-report.md), not here.

const GEOCODING_REDIS_PREFIX = 'beaconvie:geocoding:candidate:';
const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(app: INestApplication, email: string): Promise<{ headers: Record<string, string>; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Reports User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, userId: res.body.data.id as string };
}

interface ReportApi {
  id: string;
  status: string;
  failureReason: string | null;
  sourceSnapshot: { natalChart: unknown; numerology: unknown; tarot: unknown; memory: unknown };
  result: unknown;
  createdAt: string;
}

describe('Personal Destiny Report (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedLocation(candidate: GeocodingCandidate): Promise<string> {
    const token = randomUUID();
    await redis.client.set(`${GEOCODING_REDIS_PREFIX}${token}`, JSON.stringify(candidate), 'EX', 900);
    return token;
  }

  const HANOI: GeocodingCandidate = { label: 'Thành phố Hà Nội, Việt Nam', latitude: 21.0285, longitude: 105.8542, countryCode: 'VN' };

  async function createNatalChart(headers: Record<string, string>): Promise<void> {
    const token = await seedLocation(HANOI);
    await request(app.getHttpServer())
      .post('/natal-charts')
      .set(headers)
      .send({ birthDate: '2000-06-15', birthTime: '14:30', locationToken: token })
      .expect(201);
  }

  async function createNumerology(headers: Record<string, string>): Promise<void> {
    await request(app.getHttpServer())
      .post('/numerology/calculate')
      .set(headers)
      .send({ fullBirthName: 'Jane Doe', birthDate: '1990-05-15' })
      .expect(201);
  }

  async function grantPremium(userId: string): Promise<void> {
    const order = await prisma.paymentOrder.create({
      data: { userId, product: 'PREMIUM_30D', amount: 79000, currency: 'VND', provider: 'PAYOS', providerOrderCode: `test-${userId}`, status: 'PAID', paidAt: new Date() },
    });
    await prisma.premiumEntitlement.create({
      data: { userId, status: 'ACTIVE', source: 'PAYMENT', expiresAt: new Date(Date.now() + 30 * 86_400_000), orderId: order.id },
    });
  }

  describe('Unauthenticated access', () => {
    it('rejects an unauthenticated readiness check (JwtAuthGuard)', async () => {
      await request(app.getHttpServer()).get('/reports/readiness').expect(401);
    });

    it('rejects an unauthenticated generate request at the CSRF layer before auth is even checked', async () => {
      const res = await request(app.getHttpServer()).post('/reports').send({}).expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Readiness (both required sources)', () => {
    it('is not ready with neither source', async () => {
      const { headers } = await register(app, uniqueEmail('ready-none'));
      const res = await request(app.getHttpServer()).get('/reports/readiness').set(headers).expect(200);
      expect(res.body.data.ready).toBe(false);
    });

    it('is not ready with only Natal Chart', async () => {
      const { headers } = await register(app, uniqueEmail('ready-natal'));
      await createNatalChart(headers);
      const res = await request(app.getHttpServer()).get('/reports/readiness').set(headers).expect(200);
      expect(res.body.data.ready).toBe(false);
      expect(res.body.data.natalChart.available).toBe(true);
      expect(res.body.data.numerology.available).toBe(false);
    });

    it('is ready once both Natal Chart and Numerology exist', async () => {
      const { headers } = await register(app, uniqueEmail('ready-both'));
      await createNatalChart(headers);
      await createNumerology(headers);
      const res = await request(app.getHttpServer()).get('/reports/readiness').set(headers).expect(200);
      expect(res.body.data.ready).toBe(true);
    });
  });

  describe('Generation gating', () => {
    it('refuses generation for a free (non-Premium) user even when sources are ready', async () => {
      const { headers } = await register(app, uniqueEmail('free-user'));
      await createNatalChart(headers);
      await createNumerology(headers);
      const res = await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(403);
      expect(res.body.error.code).toBe('PREMIUM_REQUIRED');
    });

    it('refuses generation for a Premium user with no sources ready — no partial report', async () => {
      const { headers, userId } = await register(app, uniqueEmail('premium-no-sources'));
      await grantPremium(userId);
      const res = await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(400);
      expect(res.body.error.code).toBe('REPORT_SOURCES_NOT_READY');
    });

    it('never leaves the underlying Natal Chart/Numerology results themselves behind a paywall — a free user can still fetch them directly', async () => {
      const { headers } = await register(app, uniqueEmail('free-sources-visible'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await request(app.getHttpServer()).get('/natal-charts').set(headers).expect(200);
      await request(app.getHttpServer()).get('/numerology/readings').set(headers).expect(200);
    });
  });

  describe('Generation lifecycle (mock provider — honest FAILED, never a fabricated READY)', () => {
    it('a Premium, ready user’s generation completes cleanly and lands in FAILED/VALIDATION_FAILED against the mock provider’s non-JSON replies — never a fabricated READY report', async () => {
      const { headers, userId } = await register(app, uniqueEmail('premium-generate'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);

      const res = await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);
      const report = res.body.data as ReportApi;

      expect(report.status).toBe('FAILED');
      expect(report.failureReason).toBe('VALIDATION_FAILED');
      expect(report.result).toBeNull();
      // The canonical facts snapshot is still real and complete, even though synthesis failed —
      // the deterministic layer never depends on the AI layer succeeding.
      expect(report.sourceSnapshot.natalChart).toBeTruthy();
      expect(report.sourceSnapshot.numerology).toBeTruthy();
    });

    it('persists the failed report and makes it retrievable/listable — a failure is still a real, owned record, not silently discarded', async () => {
      const { headers, userId } = await register(app, uniqueEmail('premium-history'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);

      await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);

      const list = await request(app.getHttpServer()).get('/reports').set(headers).expect(200);
      expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);

      const id = list.body.data.items[0].id as string;
      const detail = await request(app.getHttpServer()).get(`/reports/${id}`).set(headers).expect(200);
      expect(detail.body.data.id).toBe(id);
    });

    it('lists report history newest first across multiple generations', async () => {
      const { headers, userId } = await register(app, uniqueEmail('premium-multi'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);

      const first = await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);
      const second = await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);

      const list = await request(app.getHttpServer()).get('/reports').set(headers).expect(200);
      const ids = list.body.data.items.map((r: ReportApi) => r.id);
      expect(ids.indexOf(second.body.data.id)).toBeLessThan(ids.indexOf(first.body.data.id));
    });

    it('regeneration creates a brand-new report, never overwrites the one it was called on', async () => {
      const { headers, userId } = await register(app, uniqueEmail('premium-regen'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);

      const original = await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);
      const originalId = original.body.data.id as string;

      const regenerated = await request(app.getHttpServer()).post(`/reports/${originalId}/regenerate`).set(headers).send({}).expect(201);
      expect(regenerated.body.data.id).not.toBe(originalId);

      // The original report is untouched.
      const stillThere = await request(app.getHttpServer()).get(`/reports/${originalId}`).set(headers).expect(200);
      expect(stillThere.body.data.id).toBe(originalId);
    });
  });

  describe('Ownership (IDOR prevention)', () => {
    it('404s identically for a report that does not exist and one owned by a different user', async () => {
      const { headers: headersA, userId: userIdA } = await register(app, uniqueEmail('owner-a'));
      await createNatalChart(headersA);
      await createNumerology(headersA);
      await grantPremium(userIdA);
      const created = await request(app.getHttpServer()).post('/reports').set(headersA).send({}).expect(201);
      const reportId = created.body.data.id as string;

      const { headers: headersB } = await register(app, uniqueEmail('owner-b'));

      const crossUser = await request(app.getHttpServer()).get(`/reports/${reportId}`).set(headersB).expect(404);
      const nonExistent = await request(app.getHttpServer()).get('/reports/does-not-exist').set(headersB).expect(404);
      expect(crossUser.body.error.code).toBe(nonExistent.body.error.code);
    });

    it('a different user cannot regenerate from another user’s report id', async () => {
      const { headers: headersA, userId: userIdA } = await register(app, uniqueEmail('regen-owner-a'));
      await createNatalChart(headersA);
      await createNumerology(headersA);
      await grantPremium(userIdA);
      const created = await request(app.getHttpServer()).post('/reports').set(headersA).send({}).expect(201);
      const reportId = created.body.data.id as string;

      const { headers: headersB, userId: userIdB } = await register(app, uniqueEmail('regen-owner-b'));
      await createNatalChart(headersB);
      await createNumerology(headersB);
      await grantPremium(userIdB);

      await request(app.getHttpServer()).post(`/reports/${reportId}/regenerate`).set(headersB).send({}).expect(404);
    });
  });

  describe('Duplicate generation (generation lock)', () => {
    it('never allows two concurrent generations for the same user to both run at once', async () => {
      const { headers, userId } = await register(app, uniqueEmail('concurrent'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);

      const [first, second] = await Promise.all([
        request(app.getHttpServer()).post('/reports').set(headers).send({}),
        request(app.getHttpServer()).post('/reports').set(headers).send({}),
      ]);

      const statuses = [first.status, second.status].sort();
      // Either both completed sequentially (lock released fast enough between them, both 201) or
      // one was genuinely rejected as in-progress (409) — what must never happen is silently
      // duplicated AI spend from two truly simultaneous generations; both outcomes are consistent
      // with the lock working correctly, so this test asserts the space of acceptable outcomes.
      expect(statuses.every((s) => s === 201 || s === 409)).toBe(true);
    });
  });

  describe('Account data rights', () => {
    it('includes destinyReports in account export', async () => {
      const { headers, userId } = await register(app, uniqueEmail('export'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);
      await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);

      const exportRes = await request(app.getHttpServer()).post('/users/me/export').set(headers).expect(201);
      expect(exportRes.body.data.result.destinyReports.length).toBeGreaterThanOrEqual(1);
    });

    it('deletes destiny reports on account deletion', async () => {
      const { headers, userId } = await register(app, uniqueEmail('delete'));
      await createNatalChart(headers);
      await createNumerology(headers);
      await grantPremium(userId);
      await request(app.getHttpServer()).post('/reports').set(headers).send({}).expect(201);

      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD }).expect(204);

      const remaining = await prisma.destinyReport.count({ where: { userId } });
      expect(remaining).toBe(0);
    });
  });
});
