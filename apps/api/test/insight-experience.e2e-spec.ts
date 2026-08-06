import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

// Sprint 5A — Insight Experience e2e coverage. Sprint 4C (Insight Preparation) shipped with no
// dedicated insight.e2e-spec.ts of its own; this file covers the real, running HTTP surface for
// both the original four Sprint 4C routes and this sprint's additions (cards/timeline/card/
// evidence/pin/unpin), against the real Reflection Foundation -> Insight Preparation pipeline —
// not mocked. Mirrors reflection.e2e-spec.ts's own helpers and discipline (unique email per test,
// deterministic REPEATED_JOURNAL_THEME -> SUPPORTS pattern, identical-404 ownership checks).

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Insight User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

async function createPublishedJournal(app: INestApplication, headers: Record<string, string>, title: string, tag: string) {
  const created = await request(app.getHttpServer())
    .post('/journal')
    .set(headers)
    .send({ title, content: `Notes about ${tag} for the insight experience e2e suite.`, tags: [tag] })
    .expect(201);
  const id = created.body.data.id as string;
  await request(app.getHttpServer()).post(`/journal/${id}/publish`).set(headers).expect(201);
  return id;
}

async function createThreeTaggedJournals(app: INestApplication, headers: Record<string, string>, tag: string): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    ids.push(await createPublishedJournal(app, headers, `Entry ${i} ${tag}`, tag));
  }
  return ids;
}

interface InsightCardApi {
  id: string;
  category: { value: string; label: string };
  status: { value: string; label: string };
  priorityBadge: { tier: string; label: string; priority: number };
  reason: { headline: string; whyItMatters: string[]; evidenceSummary: string };
  evidenceCount: number;
  relationshipCount: number;
  pinned: boolean;
}

interface InsightEvidenceApi {
  reflectionCandidateId: string;
  href: string;
  sources: { sourceType: string; sourceId: string; href: string | null; available: boolean }[];
}

/** Two REPEATED_JOURNAL_THEME reflections (same category JOURNAL, different tags, created close
 * together) deterministically classify as SUPPORTS (insight-relationship.util.ts), clustering into
 * one InsightCandidate with 2 evidence rows — the same real pattern flow-16/flow-17 already rely on. */
async function seedTwoTagInsight(app: INestApplication, headers: Record<string, string>, label: string) {
  const tagA = `${label}-a-${Date.now()}`;
  const tagB = `${label}-b-${Date.now()}`;
  const journalIdsA = await createThreeTaggedJournals(app, headers, tagA);
  const journalIdsB = await createThreeTaggedJournals(app, headers, tagB);
  return { tagA, tagB, journalIdsA, journalIdsB };
}

async function findCardByMarker(app: INestApplication, headers: Record<string, string>, marker: string): Promise<InsightCardApi> {
  const res = await request(app.getHttpServer()).get('/insight-candidates/cards?pageSize=100&sort=recent').set(headers).expect(200);
  const items = res.body.data.items as InsightCardApi[];
  const match = items.find((c) => c.reason.headline.includes(marker) || c.reason.headline.includes('SUPPORTS'));
  if (!match) throw new Error(`No InsightCard found for marker "${marker}". Cards: ${JSON.stringify(items)}`);
  return match;
}

describe('Insight Experience (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cards — filters (priority/category/status/source/date/pinned)', () => {
    it('filters by category, priority tier, source, and status; excludes ARCHIVED by default', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('cards-filters'));
      const { tagA } = await seedTwoTagInsight(app, headers, 'filters');
      const card = await findCardByMarker(app, headers, tagA);

      const byCategory = await request(app.getHttpServer())
        .get(`/insight-candidates/cards?category=${card.category.value}`)
        .set(headers)
        .expect(200);
      expect((byCategory.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(true);

      const byWrongCategory = await request(app.getHttpServer())
        .get(`/insight-candidates/cards?category=WELLBEING`)
        .set(headers)
        .expect(200);
      expect((byWrongCategory.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(false);

      const bySource = await request(app.getHttpServer()).get('/insight-candidates/cards?source=JOURNAL').set(headers).expect(200);
      expect((bySource.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(true);

      const byWrongSource = await request(app.getHttpServer()).get('/insight-candidates/cards?source=COMPANION').set(headers).expect(200);
      expect((byWrongSource.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(false);

      const byPriorityTier = await request(app.getHttpServer())
        .get(`/insight-candidates/cards?priorityTier=${card.priorityBadge.tier}`)
        .set(headers)
        .expect(200);
      expect((byPriorityTier.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(true);

      const defaultView = await request(app.getHttpServer()).get('/insight-candidates/cards').set(headers).expect(200);
      expect((defaultView.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(true);

      const byDateExcluding = await request(app.getHttpServer())
        .get(`/insight-candidates/cards?from=${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}`)
        .set(headers)
        .expect(200);
      expect((byDateExcluding.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(false);
    });

    it('pinned filter and pin/unpin toggle', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('pin'));
      const { tagA } = await seedTwoTagInsight(app, headers, 'pin');
      const card = await findCardByMarker(app, headers, tagA);

      const pinned = await request(app.getHttpServer()).post(`/insight-candidates/${card.id}/pin`).set(headers).expect(201);
      expect(pinned.body.data.pinned).toBe(true);

      const pinnedList = await request(app.getHttpServer()).get('/insight-candidates/cards?pinned=true').set(headers).expect(200);
      expect((pinnedList.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(true);

      const unpinned = await request(app.getHttpServer()).post(`/insight-candidates/${card.id}/unpin`).set(headers).expect(201);
      expect(unpinned.body.data.pinned).toBe(false);

      const unpinnedList = await request(app.getHttpServer()).get('/insight-candidates/cards?pinned=true').set(headers).expect(200);
      expect((unpinnedList.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(false);
    });

    it('rejects pin/unpin without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('pin-csrf'));
      const { tagA } = await seedTwoTagInsight(app, headers, 'pincsrf');
      const card = await findCardByMarker(app, headers, tagA);

      const res = await request(app.getHttpServer())
        .post(`/insight-candidates/${card.id}/pin`)
        .set('Cookie', headers.Cookie)
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Timeline — range and groupBy', () => {
    it('the default (week) range includes a just-created insight, grouped by category/priority/topic', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('timeline'));
      const { tagA } = await seedTwoTagInsight(app, headers, 'timeline');
      const card = await findCardByMarker(app, headers, tagA);

      const byCategory = await request(app.getHttpServer()).get('/insight-candidates/timeline?groupBy=category').set(headers).expect(200);
      const categoryGroup = byCategory.body.data.groups.find((g: { items: InsightCardApi[] }) => g.items.some((i) => i.id === card.id));
      expect(categoryGroup).toBeDefined();

      const byPriority = await request(app.getHttpServer()).get('/insight-candidates/timeline?groupBy=priority').set(headers).expect(200);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(byPriority.body.data.groups[0]?.key);

      const byTopic = await request(app.getHttpServer()).get('/insight-candidates/timeline?groupBy=topic').set(headers).expect(200);
      expect(byTopic.body.data.groups.some((g: { items: InsightCardApi[] }) => g.items.some((i) => i.id === card.id))).toBe(true);

      const today = await request(app.getHttpServer()).get('/insight-candidates/timeline?range=today').set(headers).expect(200);
      expect(today.body.data.groups.flatMap((g: { items: InsightCardApi[] }) => g.items).some((i: InsightCardApi) => i.id === card.id)).toBe(true);
    });

    it('a custom range requires both from and to', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('timeline-custom'));
      const res = await request(app.getHttpServer()).get('/insight-candidates/timeline?range=custom').set(headers).expect(400);
      expect(res.body.error.code).toBe('INSIGHT_TIMELINE_RANGE_REQUIRED');
    });
  });

  describe('Evidence View — real evidence, deleted-source reconciliation, archived-source availability', () => {
    it('every evidence item links to a real reflection with real underlying sources', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('evidence'));
      const { tagA, journalIdsA } = await seedTwoTagInsight(app, headers, 'evidence');
      const card = await findCardByMarker(app, headers, tagA);

      const evidence = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/evidence`).set(headers).expect(200);
      const items = evidence.body.data as InsightEvidenceApi[];
      expect(items.length).toBe(card.evidenceCount);
      for (const item of items) {
        expect(item.href).toBe(`/reflections?item=${item.reflectionCandidateId}`);
      }
      const journalSources = items.flatMap((i) => i.sources).filter((s) => s.sourceType === 'JOURNAL');
      expect(journalSources.length).toBeGreaterThan(0);
      expect(journalSources.every((s) => s.available && s.href?.startsWith('/journal?item='))).toBe(true);
      expect(journalIdsA.every((id) => journalSources.some((s) => s.sourceId === id))).toBe(true);
    });

    it('archiving (not deleting) a cited journal entry keeps its evidence source available and linkable', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('evidence-archived-source'));
      const { tagA, journalIdsA } = await seedTwoTagInsight(app, headers, 'evidence-arch');
      const card = await findCardByMarker(app, headers, tagA);

      await request(app.getHttpServer()).post(`/journal/${journalIdsA[0]}/archive`).set(headers).expect(201);

      const evidence = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/evidence`).set(headers).expect(200);
      const source = (evidence.body.data as InsightEvidenceApi[]).flatMap((i) => i.sources).find((s) => s.sourceId === journalIdsA[0]);
      expect(source).toBeDefined();
      expect(source!.available).toBe(true);
      expect(source!.href).toBe(`/journal?item=${journalIdsA[0]}`);
    });

    it('hard-deleting every journal entry behind one evidence reflection expires that reflection and reconciles it out of the insight’s evidence', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('evidence-deleted'));
      const { tagA, journalIdsA } = await seedTwoTagInsight(app, headers, 'evidence-del');
      const card = await findCardByMarker(app, headers, tagA);
      expect(card.evidenceCount).toBe(2);

      for (const id of journalIdsA) {
        await request(app.getHttpServer()).delete(`/journal/${id}`).set(headers).expect(200);
      }

      // Any read re-runs generation/reconciliation — the reflection built from tagA's now-deleted
      // journals expires, and InsightGenerationService.reconcileStaleCandidates strips it from this
      // candidate's evidence (see insight-generation.service.ts, the reconciliation bug fixed this
      // sprint also confirmed ruleExplanation is recomputed, not left stale).
      const reconciledCard = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/card`).set(headers).expect(200);
      expect(reconciledCard.body.data.evidenceCount).toBe(1);
      expect(reconciledCard.body.data.reason.headline).not.toContain('2 reflections');

      const evidence = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/evidence`).set(headers).expect(200);
      expect((evidence.body.data as InsightEvidenceApi[])).toHaveLength(1);
      expect((evidence.body.data as InsightEvidenceApi[]).flatMap((i) => i.sources).some((s) => journalIdsA.includes(s.sourceId))).toBe(false);
    });
  });

  describe('Archive lifecycle', () => {
    it('archiving excludes an insight from the default cards view but keeps it visible under status=ARCHIVED, and evidence still resolves', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('archive'));
      const { tagA } = await seedTwoTagInsight(app, headers, 'archive');
      const card = await findCardByMarker(app, headers, tagA);

      await request(app.getHttpServer()).post(`/insight-candidates/${card.id}/archive`).set(headers).expect(201);

      const defaultView = await request(app.getHttpServer()).get('/insight-candidates/cards').set(headers).expect(200);
      expect((defaultView.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(false);

      const archivedView = await request(app.getHttpServer()).get('/insight-candidates/cards?status=ARCHIVED').set(headers).expect(200);
      expect((archivedView.body.data.items as InsightCardApi[]).some((c) => c.id === card.id)).toBe(true);

      const evidence = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/evidence`).set(headers).expect(200);
      expect((evidence.body.data as InsightEvidenceApi[]).length).toBeGreaterThan(0);
    });
  });

  describe('Ownership and cross-user isolation', () => {
    it('card/evidence/pin/unpin 404 identically for a nonexistent id and another user’s insight', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other'));
      const { tagA } = await seedTwoTagInsight(app, owner, 'owner');
      const card = await findCardByMarker(app, owner, tagA);

      const forOtherCard = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/card`).set(other).expect(404);
      const forNonexistentCard = await request(app.getHttpServer()).get('/insight-candidates/does-not-exist/card').set(other).expect(404);
      expect(forOtherCard.body.error.code).toBe(forNonexistentCard.body.error.code);

      const forOtherEvidence = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/evidence`).set(other).expect(404);
      const forNonexistentEvidence = await request(app.getHttpServer()).get('/insight-candidates/does-not-exist/evidence').set(other).expect(404);
      expect(forOtherEvidence.body.error.code).toBe(forNonexistentEvidence.body.error.code);

      await request(app.getHttpServer()).post(`/insight-candidates/${card.id}/pin`).set(other).expect(404);
      await request(app.getHttpServer()).post(`/insight-candidates/${card.id}/unpin`).set(other).expect(404);
      await request(app.getHttpServer()).post(`/insight-candidates/${card.id}/archive`).set(other).expect(404);

      // The owner's own insight is untouched by the other user's failed attempts.
      const stillOwners = await request(app.getHttpServer()).get(`/insight-candidates/${card.id}/card`).set(owner).expect(200);
      expect(stillOwners.body.data.status.value).not.toBe('ARCHIVED');
      expect(stillOwners.body.data.pinned).toBe(false);
    });

    it('a client-provided id belonging to another user cannot be used to spoof access to their evidence via a crafted URL, nor can it leak their journal content', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('spoof-owner'));
      const attacker = await registerAndGetHeaders(app, uniqueEmail('spoof-attacker'));
      const { tagA, journalIdsA } = await seedTwoTagInsight(app, owner, 'spoof');
      const card = await findCardByMarker(app, owner, tagA);

      const attackerEvidenceAttempt = await request(app.getHttpServer())
        .get(`/insight-candidates/${card.id}/evidence`)
        .set(attacker)
        .expect(404);
      const body = JSON.stringify(attackerEvidenceAttempt.body);
      expect(body).not.toContain(journalIdsA[0]);
      expect(body.toLowerCase()).not.toContain('notes about');
    });

    it('cards and timeline never include another user’s insights', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('iso-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('iso-other'));
      const ownerSeed = await seedTwoTagInsight(app, owner, 'iso-mine');
      const otherSeed = await seedTwoTagInsight(app, other, 'iso-theirs');
      const otherCard = await findCardByMarker(app, other, otherSeed.tagA);

      const ownerCards = await request(app.getHttpServer()).get('/insight-candidates/cards?pageSize=100').set(owner).expect(200);
      expect((ownerCards.body.data.items as InsightCardApi[]).some((c) => c.id === otherCard.id)).toBe(false);

      const ownerTimeline = await request(app.getHttpServer()).get('/insight-candidates/timeline?range=month').set(owner).expect(200);
      expect(
        ownerTimeline.body.data.groups.flatMap((g: { items: InsightCardApi[] }) => g.items).some((i: InsightCardApi) => i.id === otherCard.id),
      ).toBe(false);

      // Sanity: the owner does see their own seeded insight in the same views.
      const ownerCard = await findCardByMarker(app, owner, ownerSeed.tagA);
      expect((ownerCards.body.data.items as InsightCardApi[]).some((c) => c.id === ownerCard.id)).toBe(true);
    });
  });
});
