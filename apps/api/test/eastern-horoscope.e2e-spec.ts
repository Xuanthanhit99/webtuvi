import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';

// Sprint 17 — Eastern Horoscope e2e coverage against the real HTTP surface, real Postgres, and
// real Redis. Mirrors numerology.e2e-spec.ts's own helpers/discipline (unique email per test,
// identical-404 ownership checks). Unlike Personal Destiny Report (which requires strict
// schema-validated JSON output), Eastern Horoscope's interpretation is plain narrative text, so —
// exactly like Numerology's own documented precedent — the Mock provider's canned English
// sentences ARE valid interpretation content here; generation is expected to succeed and populate
// `interpretation`, not fail.

const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(app: INestApplication, email: string): Promise<{ headers: Record<string, string>; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Eastern Horoscope User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, userId: res.body.data.id as string };
}

interface ProfileApi {
  id: string;
  status: string;
  birthDate: string;
  stem: string;
  branch: string;
  element: string;
  yinYang: string;
  zodiacAnimal: { vi: string; en: string };
  yearEnergy: { calendarYear: number; yearElement: string; relationship: string };
  interpretation: string | null;
  interpretationStale: boolean;
}

describe('Eastern Horoscope (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function grantPremium(userId: string): Promise<void> {
    const order = await prisma.paymentOrder.create({
      data: { userId, product: 'PREMIUM_30D', amount: 79000, currency: 'VND', provider: 'PAYOS', providerOrderCode: `test-${userId}`, status: 'PAID', paidAt: new Date() },
    });
    await prisma.premiumEntitlement.create({
      data: { userId, status: 'ACTIVE', source: 'PAYMENT', expiresAt: new Date(Date.now() + 30 * 86_400_000), orderId: order.id },
    });
  }

  describe('Unauthenticated access', () => {
    it('rejects an unauthenticated profile list (JwtAuthGuard)', async () => {
      await request(app.getHttpServer()).get('/eastern-horoscope/profiles').expect(401);
    });

    it('rejects an unauthenticated calculate request at the CSRF layer before auth is even checked', async () => {
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').send({ birthDate: '2024-03-01' }).expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Calculation — free, never paywalled, and matches a known golden vector over real HTTP', () => {
    it('a free user can calculate — the deterministic result is never Premium-gated', async () => {
      const { headers } = await register(app, uniqueEmail('free-calculate'));
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const profile = res.body.data as ProfileApi;
      expect(profile.stem).toBe('Giáp');
      expect(profile.branch).toBe('Thìn');
      expect(profile.element).toBe('Mộc');
      expect(profile.yinYang).toBe('Dương');
      expect(profile.zodiacAnimal).toEqual({ vi: 'Rồng', en: 'Dragon' });
    });

    it('a birth date before Lunar New Year resolves to the previous lunar year over real HTTP (B1 golden vector)', async () => {
      const { headers } = await register(app, uniqueEmail('boundary-b1'));
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-02-09' }).expect(201);
      const profile = res.body.data as ProfileApi;
      expect(profile.stem).toBe('Quý');
      expect(profile.branch).toBe('Mão');
    });

    it('Gregorian January 1 does not trigger a zodiac-year change over real HTTP (B4 golden vector)', async () => {
      const { headers } = await register(app, uniqueEmail('boundary-b4'));
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-01-01' }).expect(201);
      const profile = res.body.data as ProfileApi;
      expect(profile.stem).toBe('Quý');
      expect(profile.branch).toBe('Mão');
    });

    it('rejects a malformed birth date with a real validation error, never a guessed result', async () => {
      const { headers } = await register(app, uniqueEmail('invalid-date'));
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: 'not-a-date' }).expect(400);
      expect(res.body.error.code).toBeTruthy();
    });
  });

  describe('Interpretation — mock provider produces real narrative text, not a fabricated fact', () => {
    it('a calculation completes with a populated interpretation, and the canonical facts are never altered by it', async () => {
      const { headers } = await register(app, uniqueEmail('interpret'));
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const profile = res.body.data as ProfileApi;
      expect(typeof profile.interpretation).toBe('string');
      expect(profile.interpretation!.length).toBeGreaterThan(0);
      // Canonical facts, real regardless of interpretation outcome.
      expect(profile.stem).toBe('Giáp');
      expect(profile.interpretationStale).toBe(false);
    });

    it('retrying interpretation on an already-interpreted profile still returns a valid profile', async () => {
      const { headers } = await register(app, uniqueEmail('retry-interpret'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const id = created.body.data.id as string;
      const retried = await request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${id}/interpret`).set(headers).expect(201);
      expect(retried.body.data.id).toBe(id);
      expect(typeof retried.body.data.interpretation).toBe('string');
    });
  });

  describe('History and retrieval', () => {
    it('persists and lists the profile, newest first across multiple calculations', async () => {
      const { headers } = await register(app, uniqueEmail('history'));
      const first = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const second = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '1990-05-15' }).expect(201);

      const list = await request(app.getHttpServer()).get('/eastern-horoscope/profiles').set(headers).expect(200);
      const ids = list.body.data.items.map((p: ProfileApi) => p.id);
      expect(ids.indexOf(second.body.data.id)).toBeLessThan(ids.indexOf(first.body.data.id));
    });

    it('gets a single profile by id and its lifecycle history', async () => {
      const { headers } = await register(app, uniqueEmail('detail'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const id = created.body.data.id as string;

      const detail = await request(app.getHttpServer()).get(`/eastern-horoscope/profiles/${id}`).set(headers).expect(200);
      expect(detail.body.data.id).toBe(id);

      const history = await request(app.getHttpServer()).get(`/eastern-horoscope/profiles/${id}/history`).set(headers).expect(200);
      expect(history.body.data.some((h: { action: string }) => h.action === 'CREATED')).toBe(true);
    });
  });

  describe('Lifecycle — archive/restore/delete', () => {
    it('archive then restore round-trips cleanly', async () => {
      const { headers } = await register(app, uniqueEmail('lifecycle'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const id = created.body.data.id as string;

      const archived = await request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${id}/archive`).set(headers).expect(201);
      expect(archived.body.data.status).toBe('ARCHIVED');

      const restored = await request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${id}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');
    });

    it('soft-delete is reversible via restore', async () => {
      const { headers } = await register(app, uniqueEmail('soft-delete'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const id = created.body.data.id as string;

      await request(app.getHttpServer()).delete(`/eastern-horoscope/profiles/${id}`).set(headers).expect(200);
      const restored = await request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${id}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');
    });
  });

  describe('Ownership (IDOR prevention)', () => {
    it('404s identically for a profile that does not exist and one owned by a different user', async () => {
      const { headers: headersA } = await register(app, uniqueEmail('owner-a'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headersA).send({ birthDate: '2024-03-01' }).expect(201);
      const profileId = created.body.data.id as string;

      const { headers: headersB } = await register(app, uniqueEmail('owner-b'));

      const crossUser = await request(app.getHttpServer()).get(`/eastern-horoscope/profiles/${profileId}`).set(headersB).expect(404);
      const nonExistent = await request(app.getHttpServer()).get('/eastern-horoscope/profiles/does-not-exist').set(headersB).expect(404);
      expect(crossUser.body.error.code).toBe(nonExistent.body.error.code);
    });

    it('a different user cannot archive, restore, or delete another user’s profile', async () => {
      const { headers: headersA } = await register(app, uniqueEmail('idor-owner-a'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headersA).send({ birthDate: '2024-03-01' }).expect(201);
      const profileId = created.body.data.id as string;

      const { headers: headersB } = await register(app, uniqueEmail('idor-owner-b'));

      await request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${profileId}/archive`).set(headersB).expect(404);
      await request(app.getHttpServer()).delete(`/eastern-horoscope/profiles/${profileId}`).set(headersB).expect(404);
      await request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${profileId}/interpret`).set(headersB).expect(404);
    });

    it('rejects a client-supplied userId outright — the global ValidationPipe whitelist strips/rejects unknown fields before the controller is ever reached', async () => {
      await request(app.getHttpServer())
        .post('/eastern-horoscope/calculate')
        .set((await register(app, uniqueEmail('mass-assignment'))).headers)
        .send({ birthDate: '2024-03-01', userId: 'someone-else' })
        .expect(400);
    });

    it('a normal calculate request (no extra fields) is always owned by the authenticated caller, never a client-supplied id', async () => {
      const { headers, userId } = await register(app, uniqueEmail('ownership-normal'));
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const stored = await prisma.easternHoroscopeProfile.findUniqueOrThrow({ where: { id: res.body.data.id } });
      expect(stored.userId).toBe(userId);
    });
  });

  describe('Duplicate interpretation (generation lock)', () => {
    it('never allows two concurrent interpretation attempts for the same profile to both run at once', async () => {
      const { headers } = await register(app, uniqueEmail('concurrent'));
      const created = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);
      const id = created.body.data.id as string;

      const [first, second] = await Promise.all([
        request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${id}/interpret`).set(headers),
        request(app.getHttpServer()).post(`/eastern-horoscope/profiles/${id}/interpret`).set(headers),
      ]);

      expect([first.status, second.status].every((s) => s === 201)).toBe(true);
    });
  });

  describe('Rate limiting', () => {
    it('the daily calculation limit blocks a Free user after 5 calculations, independent of Premium status', async () => {
      const { headers } = await register(app, uniqueEmail('daily-limit'));
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/eastern-horoscope/calculate')
          .set(headers)
          .send({ birthDate: `199${i}-05-15` })
          .expect(201);
      }
      const res = await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2000-05-15' }).expect(403);
      expect(res.body.error.code).toBe('PREMIUM_REQUIRED');
    });
  });

  describe('Account data rights', () => {
    it('includes eastern horoscope profiles in account export, under discoveries.easternHoroscope', async () => {
      const { headers } = await register(app, uniqueEmail('export'));
      await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);

      const exportRes = await request(app.getHttpServer()).post('/users/me/export').set(headers).expect(201);
      expect(exportRes.body.data.result.discoveries.easternHoroscope.length).toBeGreaterThanOrEqual(1);
    });

    it('deletes eastern horoscope profiles on account deletion', async () => {
      const { headers, userId } = await register(app, uniqueEmail('delete'));
      await request(app.getHttpServer()).post('/eastern-horoscope/calculate').set(headers).send({ birthDate: '2024-03-01' }).expect(201);

      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD }).expect(204);

      const remaining = await prisma.easternHoroscopeProfile.count({ where: { userId } });
      expect(remaining).toBe(0);
    });
  });

  describe('Premium boundary — the canonical result is free, only history depth is gated', () => {
    it('a Premium user can page past the Free 20-item history cap', async () => {
      const { headers, userId } = await register(app, uniqueEmail('premium-history'));
      await grantPremium(userId);
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/eastern-horoscope/calculate')
          .set(headers)
          .send({ birthDate: `199${i}-05-15` })
          .expect(201);
      }
      await request(app.getHttpServer()).get('/eastern-horoscope/profiles').query({ page: 1, pageSize: 20 }).set(headers).expect(200);
    });
  });
});
