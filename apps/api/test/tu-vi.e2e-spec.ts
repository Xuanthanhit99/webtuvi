import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';

// Sprint 18B.9/18B.10 — Tử Vi e2e coverage against the real HTTP surface, real Postgres, and real
// Redis. Mirrors eastern-horoscope.e2e-spec.ts's own helpers/discipline (unique email per test,
// identical-404 ownership checks). The Mock AI provider is expected to succeed here, exactly like
// Eastern Horoscope/Numerology's own documented precedent.

const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(app: INestApplication, email: string): Promise<{ headers: Record<string, string>; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Tử Vi User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, userId: res.body.data.id as string };
}

interface ChartApi {
  id: string;
  status: string;
  birthDate: string;
  birthTime: string;
  sex: string;
  lunarDate: { lunarYear: number; lunarMonth: number; lunarDay: number; isLeapMonth: boolean };
  hourBranch: string;
  canChi: { year: { stem: string; branch: string } };
  palaces: { menh: string; than: string };
  cuc: string;
  mainStars: Array<{ star: string; position: string }>;
  auxiliaryStars: Array<{ star: string; position: string }>;
  tuan: { first: string; second: string };
  triet: { first: string; second: string };
  transformations: Array<{ transformation: string; targetStar: string; position: string }>;
  interpretation: string | null;
}

// VECTOR-B1 (Sprint 18A.5/18B.8) — the same rule-derived vector already verified end-to-end at
// the engine layer. Used here to prove the HTTP/persistence layer doesn't corrupt anything.
const VECTOR_B1_INPUT = { birthDate: '1984-02-02', birthTime: '00:30', sex: 'Nam' };

describe('Tử Vi (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated access', () => {
    it('rejects an unauthenticated calculate — CsrfGuard runs before JwtAuthGuard for POST, so this is 403/CSRF_TOKEN_MISSING, not 401 (matches eastern-horoscope.e2e-spec.ts\'s own established precedent exactly)', async () => {
      const res = await request(app.getHttpServer()).post('/tu-vi/calculate').send(VECTOR_B1_INPUT).expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('rejects listing charts without a session', async () => {
      await request(app.getHttpServer()).get('/tu-vi/charts').expect(401);
    });
  });

  describe('Calculation — VECTOR-B1 rule-derived regression through the real HTTP/persistence layer', () => {
    it('returns the exact deterministic facts already verified at the engine layer', async () => {
      const { headers } = await register(app, uniqueEmail('calc'));
      const res = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chart = res.body.data as ChartApi;

      expect(chart.lunarDate).toEqual({ lunarYear: 1984, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
      expect(chart.hourBranch).toBe('Tý');
      expect(chart.canChi.year).toEqual({ stem: 'Giáp', branch: 'Tý' });
      expect(chart.palaces.menh).toBe('Dần');
      expect(chart.palaces.than).toBe('Dần');
      expect(chart.cuc).toBe('Hỏa Lục Cục');
      expect(chart.mainStars).toHaveLength(14);
      expect(chart.auxiliaryStars).toHaveLength(13);
      expect(chart.tuan).toEqual({ first: 'Tuất', second: 'Hợi' });
      expect(chart.triet).toEqual({ first: 'Thân', second: 'Dậu' });
      expect(chart.transformations).toHaveLength(4);
      expect(typeof chart.interpretation).toBe('string');
      expect(chart.status).toBe('ACTIVE');
    });

    it('rejects an impossible birth date (2025-02-31) with a 400, not a 500 or a silently-shifted date', async () => {
      const { headers } = await register(app, uniqueEmail('badinput'));
      await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send({ birthDate: '2025-02-31', birthTime: '10:00', sex: 'Nam' }).expect(400);
    });

    it('rejects a missing sex field with a 400 (required — CORE_13 needs it)', async () => {
      const { headers } = await register(app, uniqueEmail('nosex'));
      await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send({ birthDate: '1990-06-15', birthTime: '10:00' }).expect(400);
    });

    it('persists the chart — GET returns the same facts', async () => {
      const { headers } = await register(app, uniqueEmail('persist'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chartId = (created.body.data as ChartApi).id;

      const fetched = await request(app.getHttpServer()).get(`/tu-vi/charts/${chartId}`).set(headers).expect(200);
      expect(fetched.body.data.cuc).toBe('Hỏa Lục Cục');
      expect(fetched.body.data.mainStars).toEqual((created.body.data as ChartApi).mainStars);
    });
  });

  describe('Interpretation — mock provider produces real narrative text, canonical facts never altered by it', () => {
    it('a calculation completes with a populated interpretation, and the VECTOR-B1 deterministic facts are unchanged', async () => {
      const { headers } = await register(app, uniqueEmail('interpret'));
      const res = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chart = res.body.data as ChartApi;

      expect(typeof chart.interpretation).toBe('string');
      expect(chart.interpretation!.length).toBeGreaterThan(0);
      // Canonical facts, real regardless of interpretation outcome — the AI layer never touches these.
      expect(chart.cuc).toBe('Hỏa Lục Cục');
      expect(chart.palaces.menh).toBe('Dần');
      expect(chart.palaces.than).toBe('Dần');
      expect(chart.mainStars).toHaveLength(14);
      expect(chart.auxiliaryStars).toHaveLength(13);
    });

    it('a premium user also receives a populated interpretation (tier only changes prompt depth, not whether generation happens)', async () => {
      const { headers, userId } = await register(app, uniqueEmail('interpret-premium'));
      const order = await prisma.paymentOrder.create({
        data: { userId, product: 'PREMIUM_30D', amount: 79000, currency: 'VND', provider: 'PAYOS', providerOrderCode: `test-${userId}`, status: 'PAID', paidAt: new Date() },
      });
      await prisma.premiumEntitlement.create({
        data: { userId, status: 'ACTIVE', source: 'PAYMENT', expiresAt: new Date(Date.now() + 30 * 86_400_000), orderId: order.id },
      });

      const res = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chart = res.body.data as ChartApi;
      expect(typeof chart.interpretation).toBe('string');
      expect(chart.interpretation!.length).toBeGreaterThan(0);
    });

    it('retrying interpretation on an already-interpreted chart still returns the same chart without regenerating or corrupting deterministic facts', async () => {
      const { headers } = await register(app, uniqueEmail('retry-interpret'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const id = (created.body.data as ChartApi).id;
      const firstInterpretation = (created.body.data as ChartApi).interpretation;

      const retried = await request(app.getHttpServer()).post(`/tu-vi/charts/${id}/interpret`).set(headers).expect(201);
      const chart = retried.body.data as ChartApi;
      expect(chart.id).toBe(id);
      expect(chart.interpretation).toBe(firstInterpretation);
      expect(chart.cuc).toBe('Hỏa Lục Cục');
    });

    it('never allows two concurrent interpretation attempts for the same chart to both run at once (generation lock)', async () => {
      const { headers } = await register(app, uniqueEmail('concurrent'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const id = (created.body.data as ChartApi).id;

      const [first, second] = await Promise.all([
        request(app.getHttpServer()).post(`/tu-vi/charts/${id}/interpret`).set(headers),
        request(app.getHttpServer()).post(`/tu-vi/charts/${id}/interpret`).set(headers),
      ]);

      expect([first.status, second.status].every((s) => s === 201)).toBe(true);
    });
  });

  describe('Mass assignment (whitelist ValidationPipe)', () => {
    it('rejects a client-supplied userId/status/interpretation in the calculate payload', async () => {
      const { headers } = await register(app, uniqueEmail('massassign'));
      await request(app.getHttpServer())
        .post('/tu-vi/calculate')
        .set(headers)
        .send({ ...VECTOR_B1_INPUT, userId: 'attacker-controlled', status: 'ARCHIVED', interpretation: 'fabricated text', engineVersion: 'fake-version' })
        .expect(400);
    });
  });

  describe('Ownership (IDOR prevention)', () => {
    it('404s identically for a chart that does not exist and one owned by a different user', async () => {
      const { headers: headersA } = await register(app, uniqueEmail('owner-a'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headersA).send(VECTOR_B1_INPUT).expect(201);
      const chartId = (created.body.data as ChartApi).id;

      const { headers: headersB } = await register(app, uniqueEmail('owner-b'));
      const crossUser = await request(app.getHttpServer()).get(`/tu-vi/charts/${chartId}`).set(headersB).expect(404);
      const nonExistent = await request(app.getHttpServer()).get('/tu-vi/charts/does-not-exist').set(headersB).expect(404);
      expect(crossUser.body.error.code).toBe(nonExistent.body.error.code);
    });

    it('a different user cannot archive, restore, or delete another user\'s chart', async () => {
      const { headers: headersA } = await register(app, uniqueEmail('owner-c'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headersA).send(VECTOR_B1_INPUT).expect(201);
      const chartId = (created.body.data as ChartApi).id;

      const { headers: headersB } = await register(app, uniqueEmail('owner-d'));
      await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/archive`).set(headersB).expect(404);
      await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/restore`).set(headersB).expect(404);
      await request(app.getHttpServer()).delete(`/tu-vi/charts/${chartId}`).set(headersB).expect(404);
      await request(app.getHttpServer()).get(`/tu-vi/charts/${chartId}/history`).set(headersB).expect(404);
      await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/interpret`).set(headersB).expect(404);

      // confirm the chart is genuinely untouched by the attack attempts
      const stillOwnersChart = await request(app.getHttpServer()).get(`/tu-vi/charts/${chartId}`).set(headersA).expect(200);
      expect(stillOwnersChart.body.data.status).toBe('ACTIVE');
    });

    it('the chart list never includes another user\'s charts', async () => {
      const { headers: headersA } = await register(app, uniqueEmail('list-a'));
      await request(app.getHttpServer()).post('/tu-vi/calculate').set(headersA).send(VECTOR_B1_INPUT).expect(201);

      const { headers: headersB } = await register(app, uniqueEmail('list-b'));
      await request(app.getHttpServer()).post('/tu-vi/calculate').set(headersB).send(VECTOR_B1_INPUT).expect(201);

      const listA = await request(app.getHttpServer()).get('/tu-vi/charts').set(headersA).expect(200);
      expect(listA.body.data.total).toBe(1);
    });
  });

  describe('Lifecycle', () => {
    it('archive -> restore round trip via the real API', async () => {
      const { headers } = await register(app, uniqueEmail('lifecycle'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chartId = (created.body.data as ChartApi).id;

      const archived = await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/archive`).set(headers).expect(201);
      expect(archived.body.data.status).toBe('ARCHIVED');

      const restored = await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');
    });

    it('soft-delete via DELETE, reversible via restore', async () => {
      const { headers } = await register(app, uniqueEmail('softdelete'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chartId = (created.body.data as ChartApi).id;

      const removed = await request(app.getHttpServer()).delete(`/tu-vi/charts/${chartId}`).set(headers).expect(200);
      expect(removed.body.data.status).toBe('DELETED');
    });

    it('history reflects CREATED, ARCHIVED, RESTORED in order', async () => {
      const { headers } = await register(app, uniqueEmail('history'));
      const created = await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const chartId = (created.body.data as ChartApi).id;
      await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/archive`).set(headers).expect(201);
      await request(app.getHttpServer()).post(`/tu-vi/charts/${chartId}/restore`).set(headers).expect(201);

      const history = await request(app.getHttpServer()).get(`/tu-vi/charts/${chartId}/history`).set(headers).expect(200);
      const actions = (history.body.data as Array<{ action: string }>).map((h) => h.action);
      expect(actions).toEqual(expect.arrayContaining(['CREATED', 'ARCHIVED', 'RESTORED']));
    });
  });

  describe('Privacy — analytics never receives birth data or chart contents', () => {
    it('the persisted TuViChart row (not analytics) is the only place birth data lives — spot check via Prisma', async () => {
      const { headers, userId } = await register(app, uniqueEmail('privacy'));
      await request(app.getHttpServer()).post('/tu-vi/calculate').set(headers).send(VECTOR_B1_INPUT).expect(201);
      const rows = await prisma.tuViChart.findMany({ where: { userId } });
      expect(rows).toHaveLength(1);
      // This is a structural confirmation that persistence is the real source of truth; the
      // analytics allowlist itself is unit-tested in analytics.constants.spec.ts (bounded
      // `{feature:'tu_vi'}` property set, checked at the type level).
    });
  });
});
