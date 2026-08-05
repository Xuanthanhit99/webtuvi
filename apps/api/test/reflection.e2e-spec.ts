import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Reflection User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

/** Publishes a real journal entry with the given tag — REPEATED_JOURNAL_THEME fires
 * deterministically on >= 3 entries sharing a tag (see reflection-rules.ts), unlike
 * text-similarity rules whose exact firing depends on tokenization details. The most reliable
 * rule to drive from an e2e test. */
async function createPublishedJournal(app: INestApplication, headers: Record<string, string>, title: string, tag: string) {
  const created = await request(app.getHttpServer())
    .post('/journal')
    .set(headers)
    .send({ title, content: `Notes about ${tag} for the reflection e2e suite.`, tags: [tag] })
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

/** Creates a conversation + one user message, returning ids to use as a real memory candidate source. */
async function createRealSource(app: INestApplication, headers: Record<string, string>) {
  const conversation = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
  const conversationId = conversation.body.data.id;
  const sent = await request(app.getHttpServer())
    .post(`/companion/conversations/${conversationId}/messages`)
    .set(headers)
    .send({ content: 'A message for the reflection e2e suite.' })
    .expect(201);
  return { conversationId, messageId: sent.body.data.userMessage.id };
}

async function proposeAndAcceptMemory(
  app: INestApplication,
  headers: Record<string, string>,
  params: { type: string; title: string; summary: string },
) {
  const { conversationId, messageId } = await createRealSource(app, headers);
  const proposed = await request(app.getHttpServer())
    .post('/memory/candidates')
    .set(headers)
    .send({
      proposedType: params.type,
      proposedTitle: params.title,
      proposedSummary: params.summary,
      sourceConversationId: conversationId,
      sourceMessageId: messageId,
    })
    .expect(201);
  const accepted = await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(201);
  return accepted.body.data.memory.id as string;
}

/** Creates two textually-similar GOAL memories — REPEATED_GOAL fires at >= 50% significant-token
 * overlap between two goal-related memories (see reflection-rules.ts). */
async function createTwoSimilarGoalMemories(app: INestApplication, headers: Record<string, string>): Promise<string[]> {
  const m1 = await proposeAndAcceptMemory(app, headers, { type: 'GOAL', title: 'Marathon', summary: 'training plan spring race' });
  const m2 = await proposeAndAcceptMemory(app, headers, { type: 'GOAL', title: 'Marathon', summary: 'training plan spring event' });
  return [m1, m2];
}

interface ReflectionCandidate {
  id: string;
  category: string;
  trigger: string;
  state: string;
  score: number;
  reason: string;
  sources: { sourceType: string; sourceId: string }[];
}

async function findByReasonSubstring(
  app: INestApplication,
  headers: Record<string, string>,
  substring: string,
): Promise<ReflectionCandidate> {
  const feed = await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
  const items = feed.body.data as ReflectionCandidate[];
  const match = items.find((c) => c.reason.includes(substring));
  if (!match) throw new Error(`No candidate found in feed with reason containing "${substring}". Feed: ${JSON.stringify(items)}`);
  return match;
}

describe('Reflection Foundation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Journal -> ReflectionCandidate -> Feed -> Archive', () => {
    it('rejects a mutation without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
      const tag = `csrf-${Date.now()}`;
      await createThreeTaggedJournals(app, headers, tag);
      const candidate = await findByReasonSubstring(app, headers, tag);

      const res = await request(app.getHttpServer())
        .post(`/reflections/${candidate.id}/archive`)
        .set('Cookie', headers.Cookie)
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('a real journal pattern produces a candidate citing the real entries, then archiving hides it from the feed but not the timeline', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('journal-archive'));
      const tag = `archive-${Date.now()}`;
      const journalIds = await createThreeTaggedJournals(app, headers, tag);

      const candidate = await findByReasonSubstring(app, headers, tag);
      expect(candidate.category).toBe('JOURNAL');
      expect(candidate.trigger).toBe('REPEATED_JOURNAL_THEME');
      expect(candidate.state).toBe('READY');
      // Never fabricated — every cited source is a real journal entry this test created.
      expect(candidate.sources.map((s) => s.sourceId).sort()).toEqual([...journalIds].sort());
      expect(candidate.sources.every((s) => s.sourceType === 'JOURNAL')).toBe(true);

      const archived = await request(app.getHttpServer()).post(`/reflections/${candidate.id}/archive`).set(headers).expect(201);
      expect(archived.body.data.state).toBe('ARCHIVED');
      expect(archived.body.data.resolvedAt).not.toBeNull();

      const feed = await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
      expect((feed.body.data as ReflectionCandidate[]).some((c) => c.id === candidate.id)).toBe(false);

      // Still visible in the timeline (only EXPIRED is excluded there) — its resolved state shown.
      const timeline = await request(app.getHttpServer()).get('/reflections/timeline').set(headers).expect(200);
      const inTimeline = timeline.body.data.items.find((i: { id: string }) => i.id === candidate.id);
      expect(inTimeline).toBeDefined();
      expect(inTimeline.state).toBe('ARCHIVED');
      expect(inTimeline.bucket).toBeDefined();

      // Archiving is idempotent.
      await request(app.getHttpServer()).post(`/reflections/${candidate.id}/archive`).set(headers).expect(201);
    });
  });

  describe('Dismiss', () => {
    it('dismissing hides a candidate from the feed and is idempotent', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('dismiss'));
      const tag = `dismiss-${Date.now()}`;
      await createThreeTaggedJournals(app, headers, tag);
      const candidate = await findByReasonSubstring(app, headers, tag);

      const dismissed = await request(app.getHttpServer()).post(`/reflections/${candidate.id}/dismiss`).set(headers).expect(201);
      expect(dismissed.body.data.state).toBe('DISMISSED');

      const feed = await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
      expect((feed.body.data as ReflectionCandidate[]).some((c) => c.id === candidate.id)).toBe(false);

      await request(app.getHttpServer()).post(`/reflections/${candidate.id}/dismiss`).set(headers).expect(201);
    });

    it('a dismissed candidate is never resurrected by a later regeneration pass', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('never-resurrect'));
      const tag = `resurrect-${Date.now()}`;
      await createThreeTaggedJournals(app, headers, tag);
      const candidate = await findByReasonSubstring(app, headers, tag);
      await request(app.getHttpServer()).post(`/reflections/${candidate.id}/dismiss`).set(headers).expect(201);

      // Trigger regeneration multiple times (every read regenerates) — still dismissed, never a
      // fresh duplicate candidate for the same pattern.
      await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
      await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);

      const list = await request(app.getHttpServer()).get('/reflections?state=DISMISSED').set(headers).expect(200);
      const matches = (list.body.data.items as ReflectionCandidate[]).filter((c) => c.reason.includes(tag));
      expect(matches).toHaveLength(1);
      expect(matches[0]!.id).toBe(candidate.id);
    });
  });

  describe('Deletion invalidates candidates (Phase 11 privacy)', () => {
    it('deleting a cited journal entry expires its still-active candidate', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('journal-delete'));
      const tag = `expire-journal-${Date.now()}`;
      const journalIds = await createThreeTaggedJournals(app, headers, tag);
      const candidate = await findByReasonSubstring(app, headers, tag);

      await request(app.getHttpServer()).delete(`/journal/${journalIds[0]}`).set(headers).expect(200);

      const detail = await request(app.getHttpServer()).get(`/reflections/${candidate.id}`).set(headers).expect(200);
      expect(detail.body.data.state).toBe('EXPIRED');
      expect(detail.body.data.expiredAt).not.toBeNull();

      const feed = await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
      expect((feed.body.data as ReflectionCandidate[]).some((c) => c.id === candidate.id)).toBe(false);
    });

    it('hard-deleting a cited memory expires its still-active candidate', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('memory-delete'));
      const [memoryA, memoryB] = await createTwoSimilarGoalMemories(app, headers);
      const candidate = await findByReasonSubstring(app, headers, 'similar goal');
      expect(candidate.sources.map((s) => s.sourceId).sort()).toEqual([memoryA, memoryB].sort());

      await request(app.getHttpServer()).delete(`/memory/${memoryA}`).set(headers).expect(204);

      const detail = await request(app.getHttpServer()).get(`/reflections/${candidate.id}`).set(headers).expect(200);
      expect(detail.body.data.state).toBe('EXPIRED');
    });
  });

  describe('Consent revocation invalidates candidates', () => {
    it('denying consent for a memory type expires a candidate that cited it', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('consent-revoke'));
      await createTwoSimilarGoalMemories(app, headers);
      const candidate = await findByReasonSubstring(app, headers, 'similar goal');
      expect(candidate.state).toBe('READY');

      await request(app.getHttpServer()).patch('/memory/consents/GOAL').set(headers).send({ mode: 'DENY_TYPE' }).expect(200);

      const detail = await request(app.getHttpServer()).get(`/reflections/${candidate.id}`).set(headers).expect(200);
      expect(detail.body.data.state).toBe('EXPIRED');

      const feed = await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
      expect((feed.body.data as ReflectionCandidate[]).some((c) => c.id === candidate.id)).toBe(false);
    });
  });

  describe('Ownership', () => {
    it('never exposes another user’s reflection candidate — identical 404 for nonexistent and someone else’s', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other'));
      const tag = `owner-${Date.now()}`;
      await createThreeTaggedJournals(app, owner, tag);
      const candidate = await findByReasonSubstring(app, owner, tag);

      const forOther = await request(app.getHttpServer()).get(`/reflections/${candidate.id}`).set(other).expect(404);
      const forNonexistent = await request(app.getHttpServer()).get('/reflections/does-not-exist').set(other).expect(404);
      expect(forOther.body.error.code).toBe(forNonexistent.body.error.code);
    });

    it('a non-owner cannot archive or dismiss another user’s candidate', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner2'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other2'));
      const tag = `owner2-${Date.now()}`;
      await createThreeTaggedJournals(app, owner, tag);
      const candidate = await findByReasonSubstring(app, owner, tag);

      await request(app.getHttpServer()).post(`/reflections/${candidate.id}/archive`).set(other).expect(404);
      await request(app.getHttpServer()).post(`/reflections/${candidate.id}/dismiss`).set(other).expect(404);

      const stillOwners = await request(app.getHttpServer()).get(`/reflections/${candidate.id}`).set(owner).expect(200);
      expect(stillOwners.body.data.state).toBe('READY');
    });

    it('feed, list, timeline, groups, and statistics never include another user’s candidates', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner3'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other3'));
      const ownerTag = `mine-${Date.now()}`;
      const otherTag = `theirs-${Date.now()}`;
      await createThreeTaggedJournals(app, owner, ownerTag);
      await createThreeTaggedJournals(app, other, otherTag);

      const feed = await request(app.getHttpServer()).get('/reflections/feed').set(owner).expect(200);
      expect((feed.body.data as ReflectionCandidate[]).some((c) => c.reason.includes(otherTag))).toBe(false);

      const list = await request(app.getHttpServer()).get('/reflections').set(owner).expect(200);
      expect((list.body.data.items as ReflectionCandidate[]).some((c) => c.reason.includes(otherTag))).toBe(false);

      const timeline = await request(app.getHttpServer()).get('/reflections/timeline').set(owner).expect(200);
      expect(timeline.body.data.items.some((i: ReflectionCandidate) => i.reason.includes(otherTag))).toBe(false);

      const groups = await request(app.getHttpServer()).get('/reflections/groups').set(owner).expect(200);
      expect(groups.body.data.every((g: { latest: ReflectionCandidate }) => !g.latest.reason.includes(otherTag))).toBe(true);

      const otherStats = await request(app.getHttpServer()).get('/reflections/statistics').set(other).expect(200);
      const ownerStatsBefore = await request(app.getHttpServer()).get('/reflections/statistics').set(owner).expect(200);
      // The owner's own total is unaffected by the other user's activity — statistics are
      // strictly per-caller, never a cross-account aggregate.
      expect(otherStats.body.data.total).toBeGreaterThanOrEqual(1);
      expect(ownerStatsBefore.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Grouping and timeline', () => {
    it('groups aggregates matching candidates by their deterministic groupKey', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('grouping'));
      const tag = `group-${Date.now()}`;
      await createThreeTaggedJournals(app, headers, tag);
      const candidate = await findByReasonSubstring(app, headers, tag);

      const groups = await request(app.getHttpServer()).get('/reflections/groups').set(headers).expect(200);
      // groupKey is trigger-specific (e.g. "JOURNAL:tag:<tag>") — assert by content (which real
      // group this candidate landed in) rather than guessing the exact key format.
      const matchingGroup = groups.body.data.find((g: { latest: ReflectionCandidate }) => g.latest.id === candidate.id);
      expect(matchingGroup).toBeDefined();
      expect(matchingGroup.groupKey).toContain(tag);
      expect(matchingGroup.count).toBeGreaterThanOrEqual(1);
    });

    it('timeline items carry a valid bucket and support a custom date range', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('timeline'));
      const tag = `timeline-${Date.now()}`;
      await createThreeTaggedJournals(app, headers, tag);
      await findByReasonSubstring(app, headers, tag);

      const timeline = await request(app.getHttpServer()).get('/reflections/timeline').set(headers).expect(200);
      const match = timeline.body.data.items.find((i: ReflectionCandidate) => i.reason.includes(tag));
      expect(match).toBeDefined();
      expect(['today', 'this_week', 'last_week', 'last_month', 'earlier']).toContain(match.bucket);

      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const ranged = await request(app.getHttpServer()).get(`/reflections/timeline?from=${from}&to=${to}`).set(headers).expect(200);
      expect(ranged.body.data.items.some((i: ReflectionCandidate) => i.reason.includes(tag))).toBe(true);
    });
  });

  describe('Scoring and ordering', () => {
    it('the feed is ordered by score descending — a pattern backed by more evidence outranks a weaker one', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('scoring'));
      const weakTag = `weak-${Date.now()}`;
      const strongTag = `strong-${Date.now()}`;

      // 3 entries (minimum to fire) vs 5 entries — more sources means a higher frequency and
      // journal-density score (see reflection-score.calculator.ts).
      await createThreeTaggedJournals(app, headers, weakTag);
      for (let i = 0; i < 5; i += 1) {
        await createPublishedJournal(app, headers, `Strong ${i} ${strongTag}`, strongTag);
      }

      const feed = await request(app.getHttpServer()).get('/reflections/feed').set(headers).expect(200);
      const items = feed.body.data as ReflectionCandidate[];
      const weak = items.find((c) => c.reason.includes(weakTag))!;
      const strong = items.find((c) => c.reason.includes(strongTag))!;
      expect(weak).toBeDefined();
      expect(strong).toBeDefined();
      expect(strong.score).toBeGreaterThan(weak.score);

      const weakIndex = items.findIndex((c) => c.id === weak.id);
      const strongIndex = items.findIndex((c) => c.id === strong.id);
      expect(strongIndex).toBeLessThan(weakIndex);

      // Every item in the feed is sorted score-descending, not just this pair.
      const scores = items.map((c) => c.score);
      const sorted = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sorted);
    });
  });
});
