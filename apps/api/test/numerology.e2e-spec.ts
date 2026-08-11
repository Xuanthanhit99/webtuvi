import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

// Sprint 8 — Numerology Discovery Foundation e2e coverage against the real HTTP surface. Mirrors
// tarot.e2e-spec.ts's own helpers/discipline (unique email per test, identical-404 ownership
// checks). Runs against the mock AI provider (see .env.test DEFAULT_AI_PROVIDER=mock), so
// `interpretation` is expected to be populated (non-null) after a successful calculation.

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Numerology User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

interface NumerologyValueApi { type: string; value: number; isMasterNumber: boolean; appliesToYear: number | null }
interface NumerologyReadingApi {
  id: string;
  status: string;
  normalizedBirthName: string;
  birthDate: string;
  interpretation: string | null;
  values: NumerologyValueApi[];
}

describe('Numerology (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated access', () => {
    it('rejects an unauthenticated request for readings (JwtAuthGuard)', async () => {
      await request(app.getHttpServer()).get('/numerology/readings').expect(401);
    });

    it('rejects an unauthenticated calculate request at the CSRF layer before auth is even checked', async () => {
      const res = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .send({ fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Meanings reference data (Phase 13)', () => {
    it('lists the full static, deterministic meaning table for an authenticated user', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('meanings'));
      const res = await request(app.getHttpServer()).get('/numerology/meanings').set(headers).expect(200);
      const meanings = res.body.data as { type: string; value: number }[];
      expect(meanings.length).toBeGreaterThan(0);
      expect(meanings.some((m) => m.type === 'LIFE_PATH' && m.value === 11)).toBe(true);
    });
  });

  describe('Calculate (Phase 3/6/8)', () => {
    it('a real calculation persists the exact deterministic core numbers and a generated interpretation', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('calc'));
      const res = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Nguyen Van A', birthDate: '1995-08-17' })
        .expect(201);
      const reading = res.body.data as NumerologyReadingApi;

      expect(reading.status).toBe('ACTIVE');
      expect(reading.normalizedBirthName).toBe('NGUYEN VAN A');
      expect(reading.birthDate).toBe('1995-08-17');
      expect(reading.values).toHaveLength(6);

      const byType = Object.fromEntries(reading.values.map((v) => [v.type, v]));
      expect(byType['LIFE_PATH']!.value).toBe(22);
      expect(byType['LIFE_PATH']!.isMasterNumber).toBe(true);
      expect(byType['PERSONALITY']!.value).toBe(33);
      expect(byType['BIRTHDAY']!.value).toBe(8);
      expect(byType['PERSONAL_YEAR']!.appliesToYear).toBeGreaterThan(2000);

      expect(typeof reading.interpretation).toBe('string');
      expect(reading.interpretation!.length).toBeGreaterThan(0);
    });

    it('rejects an impossible calendar date', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('bad-date'));
      const res = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Jane Doe', birthDate: '2024-02-30' })
        .expect(400);
      expect(res.body.error.code).toBe('NUMEROLOGY_INVALID_CALENDAR_DATE');
    });

    it('rejects a future birth date', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('future-date'));
      const res = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Jane Doe', birthDate: '2099-01-01' })
        .expect(400);
      expect(res.body.error.code).toBe('NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED');
    });

    it('rejects a name with unsupported characters at the DTO layer', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('bad-chars'));
      await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Jane123!!', birthDate: '1990-01-01' })
        .expect(400);
    });

    it('rejects an empty name', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('empty-name'));
      await request(app.getHttpServer()).post('/numerology/calculate').set(headers).send({ fullBirthName: '', birthDate: '1990-01-01' }).expect(400);
    });

    it('rejects a calculate request without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
      const res = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set('Cookie', headers.Cookie)
        .send({ fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('a Vietnamese name with diacritics normalizes and calculates identically to its plain-ASCII equivalent', async () => {
      const headersA = await registerAndGetHeaders(app, uniqueEmail('viet-a'));
      const headersB = await registerAndGetHeaders(app, uniqueEmail('viet-b'));
      const withDiacritics = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headersA)
        .send({ fullBirthName: 'Nguyễn Văn Ánh', birthDate: '1990-01-05' })
        .expect(201);
      const plainAscii = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headersB)
        .send({ fullBirthName: 'Nguyen Van Anh', birthDate: '1990-01-05' })
        .expect(201);

      const a = withDiacritics.body.data as NumerologyReadingApi;
      const b = plainAscii.body.data as NumerologyReadingApi;
      expect(a.normalizedBirthName).toBe(b.normalizedBirthName);
      expect(a.values.find((v) => v.type === 'EXPRESSION')!.value).toBe(b.values.find((v) => v.type === 'EXPRESSION')!.value);
    });
  });

  describe('Interpretation retry (Phase 8)', () => {
    it('retrying interpretation on an already-interpreted reading still returns a valid reading', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('retry'));
      const created = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })
        .expect(201);
      const id = (created.body.data as NumerologyReadingApi).id;

      const retried = await request(app.getHttpServer()).post(`/numerology/readings/${id}/interpret`).set(headers).expect(201);
      expect((retried.body.data as NumerologyReadingApi).values).toHaveLength(6);
    });
  });

  describe('Lifecycle (Phase 6/10)', () => {
    it('archive -> restore returns to ACTIVE, and delete -> restore does the same, each writing real history', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('lifecycle'));
      const created = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })
        .expect(201);
      const id = (created.body.data as NumerologyReadingApi).id;

      const archived = await request(app.getHttpServer()).post(`/numerology/readings/${id}/archive`).set(headers).expect(201);
      expect(archived.body.data.status).toBe('ARCHIVED');
      const restored = await request(app.getHttpServer()).post(`/numerology/readings/${id}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');

      const deleted = await request(app.getHttpServer()).delete(`/numerology/readings/${id}`).set(headers).expect(200);
      expect(deleted.body.data.status).toBe('DELETED');
      const restoredAgain = await request(app.getHttpServer()).post(`/numerology/readings/${id}/restore`).set(headers).expect(201);
      expect(restoredAgain.body.data.status).toBe('ACTIVE');

      const history = await request(app.getHttpServer()).get(`/numerology/readings/${id}/history`).set(headers).expect(200);
      const actions = (history.body.data as { action: string }[]).map((h) => h.action);
      expect(actions).toEqual(expect.arrayContaining(['CREATED', 'ARCHIVED', 'RESTORED', 'DELETED']));
    });

    it('an invalid transition (archiving an already-archived reading) is rejected', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('invalid-transition'));
      const created = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })
        .expect(201);
      const id = (created.body.data as NumerologyReadingApi).id;
      await request(app.getHttpServer()).post(`/numerology/readings/${id}/archive`).set(headers).expect(201);
      await request(app.getHttpServer()).post(`/numerology/readings/${id}/archive`).set(headers).expect(400);
    });
  });

  describe('Ownership and cross-user isolation (Phase 16)', () => {
    it('getOne/history/archive/restore/delete 404 identically for a nonexistent id and another user’s reading', async () => {
      const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('other'));
      const created = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(ownerHeaders)
        .send({ fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })
        .expect(201);
      const id = (created.body.data as NumerologyReadingApi).id;

      const forReal = await request(app.getHttpServer()).get(`/numerology/readings/${id}`).set(otherHeaders).expect(404);
      const forFake = await request(app.getHttpServer()).get('/numerology/readings/does-not-exist').set(otherHeaders).expect(404);
      expect(forReal.body.error.code).toBe(forFake.body.error.code);
      expect(forReal.body.error.code).toBe('NUMEROLOGY_READING_NOT_FOUND');

      await request(app.getHttpServer()).get(`/numerology/readings/${id}/history`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/numerology/readings/${id}/archive`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/numerology/readings/${id}/restore`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).delete(`/numerology/readings/${id}`).set(otherHeaders).expect(404);
    });

    it('the reading list never includes another user’s readings', async () => {
      const mineHeaders = await registerAndGetHeaders(app, uniqueEmail('mine'));
      const theirsHeaders = await registerAndGetHeaders(app, uniqueEmail('theirs'));
      await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(theirsHeaders)
        .send({ fullBirthName: 'Theirs Name', birthDate: '1991-02-02' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(mineHeaders)
        .send({ fullBirthName: 'Mine Name', birthDate: '1992-03-03' })
        .expect(201);

      const list = await request(app.getHttpServer()).get('/numerology/readings').set(mineHeaders).expect(200);
      const names = (list.body.data.items as { birthNameInput: string }[]).map((r) => r.birthNameInput);
      expect(names).toEqual(['Mine Name']);
    });
  });

  describe('Daily calculation ceiling (Phase 16, anti-abuse)', () => {
    it('a Free account is denied after 5 calculations in the same UTC day', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('ceiling'));
      const variants = ['Name Variant Alpha', 'Name Variant Beta', 'Name Variant Gamma', 'Name Variant Delta', 'Name Variant Epsilon'];
      for (const fullBirthName of variants) {
        await request(app.getHttpServer()).post('/numerology/calculate').set(headers).send({ fullBirthName, birthDate: '1990-01-01' }).expect(201);
      }
      const res = await request(app.getHttpServer())
        .post('/numerology/calculate')
        .set(headers)
        .send({ fullBirthName: 'One Too Many', birthDate: '1990-01-01' })
        .expect(403);
      expect(res.body.error.code).toBe('PREMIUM_REQUIRED');
    });
  });
});
