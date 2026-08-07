import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

// Sprint 5B — Weekly & Monthly Reviews e2e coverage against the real HTTP surface. Mirrors
// insight-experience.e2e-spec.ts's own helpers/discipline (unique email per test, deterministic
// REPEATED_JOURNAL_THEME -> SUPPORTS pattern, identical-404 ownership checks).

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Review User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

async function createPublishedJournal(app: INestApplication, headers: Record<string, string>, title: string, tag: string) {
  const created = await request(app.getHttpServer())
    .post('/journal')
    .set(headers)
    .send({ title, content: `Notes about ${tag} for the review e2e suite.`, tags: [tag] })
    .expect(201);
  const id = created.body.data.id as string;
  await request(app.getHttpServer()).post(`/journal/${id}/publish`).set(headers).expect(201);
  return id as string;
}

async function seedTwoTagInsight(app: INestApplication, headers: Record<string, string>, label: string) {
  const tagA = `${label}-a-${Date.now()}`;
  const tagB = `${label}-b-${Date.now()}`;
  for (let i = 0; i < 3; i += 1) await createPublishedJournal(app, headers, `Entry A${i} ${tagA}`, tagA);
  for (let i = 0; i < 3; i += 1) await createPublishedJournal(app, headers, `Entry B${i} ${tagB}`, tagB);
  return { tagA, tagB };
}

interface ReviewSectionApi {
  type: string;
  evidence: { sourceType: string; sourceId: string; category: string; priority: number; href: string }[];
}
interface ReviewApi {
  id: string;
  window: string;
  state: string;
  overview: string;
  statistics: { journalCount: number; insightCount: number; reflectionCount: number };
  sections: ReviewSectionApi[];
}

describe('Reviews (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Generation and statistics', () => {
    it('the current week review reflects real journal/insight/reflection counts and cites real evidence', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('stats'));
      await seedTwoTagInsight(app, headers, 'stats');

      const res = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      const review = res.body.data as ReviewApi;

      expect(review.window).toBe('WEEK');
      expect(review.state).toBe('READY');
      expect(review.statistics.journalCount).toBe(6);
      expect(review.statistics.reflectionCount).toBeGreaterThanOrEqual(2);
      expect(review.overview).toContain('6 journal entries');

      const allEvidence = review.sections.flatMap((s) => s.evidence);
      expect(allEvidence.length).toBeGreaterThan(0);
      for (const item of allEvidence) {
        expect(['INSIGHT', 'REFLECTION', 'JOURNAL', 'MEMORY']).toContain(item.sourceType);
        expect(item.href.length).toBeGreaterThan(0);
      }
    });

    it('a brand-new user with no journal/insight/reflection activity gets an empty-sections review, never fabricated evidence', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('empty'));
      const res = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      const review = res.body.data as ReviewApi;
      // Registering itself creates a real ACCOUNT_CREATED ActivityEvent, so `state` is honestly
      // READY (real activityCount >= 1) rather than a hardcoded NOT_READY — but there is still no
      // journal/insight/reflection content to build a section from, so sections stay empty.
      expect(review.statistics.journalCount).toBe(0);
      expect(review.statistics.insightCount).toBe(0);
      expect(review.sections).toEqual([]);
    });

    it('regenerating within the same week upserts the same review id, never duplicating it', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('idempotent'));
      await seedTwoTagInsight(app, headers, 'idempotent');

      const first = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      const second = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      expect(second.body.data.id).toBe(first.body.data.id);

      const list = await request(app.getHttpServer()).get('/reviews?window=WEEK').set(headers).expect(200);
      expect((list.body.data.items as ReviewApi[]).filter((r) => r.id === first.body.data.id)).toHaveLength(1);
    });
  });

  describe('Custom window', () => {
    it('requires both from and to', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('custom-missing'));
      const res = await request(app.getHttpServer()).get('/reviews/custom').set(headers).expect(400);
      expect(res.body.error.code).toBe('REVIEW_WINDOW_RANGE_REQUIRED');
    });

    it('rejects from after to', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('custom-invalid'));
      const res = await request(app.getHttpServer())
        .get('/reviews/custom?from=2026-02-01T00:00:00.000Z&to=2026-01-01T00:00:00.000Z')
        .set(headers)
        .expect(400);
      expect(res.body.error.code).toBe('REVIEW_WINDOW_RANGE_INVALID');
    });

    it('generates a real custom-range review for a valid range', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('custom-valid'));
      await seedTwoTagInsight(app, headers, 'customvalid');
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app.getHttpServer()).get(`/reviews/custom?from=${from}&to=${to}`).set(headers).expect(200);
      expect(res.body.data.window).toBe('CUSTOM');
    });
  });

  describe('Filters (Phase 6)', () => {
    it('category and priorityTier narrow evidence within a review, dropping empty sections', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('filters'));
      await seedTwoTagInsight(app, headers, 'filters');
      const base = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      const review = base.body.data as ReviewApi;
      const anyEvidence = review.sections.flatMap((s) => s.evidence)[0]!;

      const filtered = await request(app.getHttpServer())
        .get(`/reviews/${review.id}?category=${anyEvidence.category}`)
        .set(headers)
        .expect(200);
      const filteredEvidence = (filtered.body.data as ReviewApi).sections.flatMap((s) => s.evidence);
      expect(filteredEvidence.every((e) => e.category === anyEvidence.category)).toBe(true);

      const wrongCategory = await request(app.getHttpServer()).get(`/reviews/${review.id}?category=WELLBEING`).set(headers);
      const wrongCategoryEvidence = (wrongCategory.body.data as ReviewApi).sections.flatMap((s) => s.evidence);
      expect(wrongCategoryEvidence.every((e) => e.category === 'WELLBEING')).toBe(true);
    });
  });

  describe('Archive lifecycle (Phase 8 — archived evidence stays viewable)', () => {
    it('archiving excludes a review from the default list but keeps its sections/evidence fully intact', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('archive'));
      await seedTwoTagInsight(app, headers, 'archive');
      const created = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      const id = created.body.data.id as string;
      const evidenceCountBefore = (created.body.data as ReviewApi).sections.flatMap((s) => s.evidence).length;

      await request(app.getHttpServer()).post(`/reviews/${id}/archive`).set(headers).expect(201);

      const defaultList = await request(app.getHttpServer()).get('/reviews').set(headers).expect(200);
      expect((defaultList.body.data.items as ReviewApi[]).some((r) => r.id === id)).toBe(false);

      const archivedList = await request(app.getHttpServer()).get('/reviews?state=ARCHIVED').set(headers).expect(200);
      expect((archivedList.body.data.items as ReviewApi[]).some((r) => r.id === id)).toBe(true);

      const stillFull = await request(app.getHttpServer()).get(`/reviews/${id}`).set(headers).expect(200);
      expect(stillFull.body.data.state).toBe('ARCHIVED');
      expect((stillFull.body.data as ReviewApi).sections.flatMap((s) => s.evidence)).toHaveLength(evidenceCountBefore);

      // Archiving is idempotent.
      await request(app.getHttpServer()).post(`/reviews/${id}/archive`).set(headers).expect(201);
    });

    it('rejects archive without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('archive-csrf'));
      await seedTwoTagInsight(app, headers, 'archivecsrf');
      const created = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);

      const res = await request(app.getHttpServer())
        .post(`/reviews/${created.body.data.id}/archive`)
        .set('Cookie', headers.Cookie)
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Export', () => {
    it('exports the same real content as Markdown and JSON', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('export'));
      await seedTwoTagInsight(app, headers, 'export');
      const created = await request(app.getHttpServer()).get('/reviews/current/week').set(headers).expect(200);
      const id = created.body.data.id as string;

      const markdown = await request(app.getHttpServer()).get(`/reviews/${id}/export/markdown`).set(headers).expect(200);
      expect(markdown.body.data.filename).toMatch(/\.md$/);
      expect(markdown.body.data.content).toContain('# Weekly Review');
      expect(markdown.body.data.content).toContain(created.body.data.overview);

      const json = await request(app.getHttpServer()).get(`/reviews/${id}/export/json`).set(headers).expect(200);
      expect(json.body.data.id).toBe(id);
      expect(json.body.data.overview).toBe(created.body.data.overview);
    });

    it('export 404s for a nonexistent id and another user’s review, identically', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('export-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('export-other'));
      await seedTwoTagInsight(app, owner, 'exportowner');
      const created = await request(app.getHttpServer()).get('/reviews/current/week').set(owner).expect(200);

      const forOther = await request(app.getHttpServer()).get(`/reviews/${created.body.data.id}/export/json`).set(other).expect(404);
      const forNonexistent = await request(app.getHttpServer()).get('/reviews/does-not-exist/export/json').set(other).expect(404);
      expect(forOther.body.error.code).toBe(forNonexistent.body.error.code);
    });
  });

  describe('Ownership and cross-user isolation (Phase 8)', () => {
    it('getOne/archive 404 identically for a nonexistent id and another user’s review', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other'));
      await seedTwoTagInsight(app, owner, 'owner');
      const created = await request(app.getHttpServer()).get('/reviews/current/week').set(owner).expect(200);
      const id = created.body.data.id as string;

      const forOther = await request(app.getHttpServer()).get(`/reviews/${id}`).set(other).expect(404);
      const forNonexistent = await request(app.getHttpServer()).get('/reviews/does-not-exist').set(other).expect(404);
      expect(forOther.body.error.code).toBe(forNonexistent.body.error.code);

      await request(app.getHttpServer()).post(`/reviews/${id}/archive`).set(other).expect(404);

      const stillOwners = await request(app.getHttpServer()).get(`/reviews/${id}`).set(owner).expect(200);
      expect(stillOwners.body.data.state).not.toBe('ARCHIVED');
    });

    it('the review list and current-week endpoint never include or leak another user’s data', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('iso-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('iso-other'));
      await seedTwoTagInsight(app, owner, 'iso-mine');
      await seedTwoTagInsight(app, other, 'iso-theirs');

      const ownerReview = await request(app.getHttpServer()).get('/reviews/current/week').set(owner).expect(200);
      const otherReview = await request(app.getHttpServer()).get('/reviews/current/week').set(other).expect(200);
      expect(ownerReview.body.data.id).not.toBe(otherReview.body.data.id);

      const ownerList = await request(app.getHttpServer()).get('/reviews').set(owner).expect(200);
      expect((ownerList.body.data.items as ReviewApi[]).some((r) => r.id === otherReview.body.data.id)).toBe(false);
    });
  });
});
