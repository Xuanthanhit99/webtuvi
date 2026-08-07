import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

// Sprint 5C — Goal System & Progress Engine e2e coverage against the real HTTP surface. Mirrors
// review.e2e-spec.ts's own helpers/discipline (unique email per test, identical-404 ownership
// checks, real tag-based journal evidence).

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Goal User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

async function createPublishedJournal(app: INestApplication, headers: Record<string, string>, title: string, tag: string) {
  const created = await request(app.getHttpServer())
    .post('/journal')
    .set(headers)
    .send({ title, content: `Notes about ${tag} for the goal e2e suite.`, tags: [tag] })
    .expect(201);
  const id = created.body.data.id as string;
  await request(app.getHttpServer()).post(`/journal/${id}/publish`).set(headers).expect(201);
  return id as string;
}

interface GoalEvidenceApi {
  sourceType: string;
  sourceId: string;
  contribution: string;
  href: string;
}
interface GoalApi {
  id: string;
  status: string;
  type: string;
  linkedTag: string;
  progress: { completionPercent: number; trend: string; evidence: GoalEvidenceApi[] } | null;
  milestones: { id: string; status: string; type: string }[];
}

describe('Goals (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Creation and evidence (Phase 3/4)', () => {
    it('a real, tagged, published journal entry becomes real GoalEvidence and moves completion', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('evidence'));
      const tag = `spanish-${Date.now()}`;

      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'Learn Spanish', category: 'LEARNING', type: 'METRIC_BASED', linkedTag: tag, targetValue: 2 })
        .expect(201);
      const goal = created.body.data as GoalApi;
      expect(goal.progress!.completionPercent).toBe(0);

      await createPublishedJournal(app, headers, 'Day 1', tag);
      await createPublishedJournal(app, headers, 'Day 2', tag);

      const res = await request(app.getHttpServer()).get(`/goals/${goal.id}`).set(headers).expect(200);
      const refreshed = res.body.data as GoalApi;
      expect(refreshed.progress!.completionPercent).toBe(100);
      expect(refreshed.progress!.evidence).toHaveLength(2);
      expect(refreshed.progress!.evidence.every((e) => e.sourceType === 'JOURNAL')).toBe(true);
      expect(refreshed.progress!.evidence[0]!.href).toContain('/journal?item=');
    });

    it('a journal entry with a different tag is never counted as evidence — never fabricated', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('no-match'));
      const tag = `french-${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'Learn French', category: 'LEARNING', type: 'METRIC_BASED', linkedTag: tag, targetValue: 5 })
        .expect(201);
      const goal = created.body.data as GoalApi;

      await createPublishedJournal(app, headers, 'Unrelated entry', `unrelated-${Date.now()}`);

      const res = await request(app.getHttpServer()).get(`/goals/${goal.id}`).set(headers).expect(200);
      const refreshed = res.body.data as GoalApi;
      expect(refreshed.progress!.evidence).toHaveLength(0);
      expect(refreshed.progress!.completionPercent).toBe(0);
    });

    it('METRIC_BASED creation without a target value is rejected', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('no-target'));
      await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'x', category: 'LEARNING', type: 'METRIC_BASED', linkedTag: 'x' })
        .expect(400);
    });
  });

  describe('Milestones (Phase 5)', () => {
    it('an AUTOMATIC milestone completes deterministically once evidence reaches its target', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('auto-milestone'));
      const tag = `reading-${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'Read books', category: 'LEARNING', type: 'MILESTONE_BASED', linkedTag: tag })
        .expect(201);
      const goal = created.body.data as GoalApi;

      const milestone = await request(app.getHttpServer())
        .post(`/goals/${goal.id}/milestones`)
        .set(headers)
        .send({ title: 'First 2 entries', type: 'AUTOMATIC', targetCount: 2 })
        .expect(201);
      expect(milestone.body.data.status).toBe('PENDING');

      await createPublishedJournal(app, headers, 'Entry 1', tag);
      await createPublishedJournal(app, headers, 'Entry 2', tag);

      const res = await request(app.getHttpServer()).get(`/goals/${goal.id}`).set(headers).expect(200);
      const refreshed = res.body.data as GoalApi;
      expect(refreshed.milestones.find((m) => m.id === milestone.body.data.id)!.status).toBe('COMPLETED');
      expect(refreshed.progress!.completionPercent).toBe(100);
    });

    it('a MANUAL milestone is only ever completed by an explicit action, never by evidence alone', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('manual-milestone'));
      const tag = `writing-${Date.now()}`;
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'Write daily', category: 'CREATIVE', type: 'MILESTONE_BASED', linkedTag: tag })
        .expect(201);
      const goal = created.body.data as GoalApi;

      const milestone = await request(app.getHttpServer())
        .post(`/goals/${goal.id}/milestones`)
        .set(headers)
        .send({ title: 'Finish draft', type: 'MANUAL' })
        .expect(201);

      for (let i = 0; i < 5; i += 1) await createPublishedJournal(app, headers, `Entry ${i}`, tag);
      await request(app.getHttpServer()).get(`/goals/${goal.id}`).set(headers).expect(200);

      const stillPending = await request(app.getHttpServer())
        .get(`/goals/${goal.id}`)
        .set(headers)
        .expect(200);
      expect((stillPending.body.data as GoalApi).milestones.find((m) => m.id === milestone.body.data.id)!.status).toBe('PENDING');

      const completed = await request(app.getHttpServer()).post(`/goals/${goal.id}/milestones/${milestone.body.data.id}/complete`).set(headers).expect(201);
      expect(completed.body.data.status).toBe('COMPLETED');
    });
  });

  describe('Lifecycle (Phase 2)', () => {
    it('pause -> resume -> complete, each writing real history', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('lifecycle'));
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'x', category: 'PERSONAL', type: 'BINARY', linkedTag: `x-${Date.now()}` })
        .expect(201);
      const id = created.body.data.id as string;

      await request(app.getHttpServer()).post(`/goals/${id}/pause`).set(headers).expect(201);
      await request(app.getHttpServer()).post(`/goals/${id}/resume`).set(headers).expect(201);
      const completed = await request(app.getHttpServer()).post(`/goals/${id}/complete`).set(headers).expect(201);
      expect(completed.body.data.status).toBe('COMPLETED');
      expect((completed.body.data as GoalApi).progress!.completionPercent).toBe(100);

      const history = await request(app.getHttpServer()).get(`/goals/${id}/history`).set(headers).expect(200);
      const actions = (history.body.data as { action: string }[]).map((h) => h.action);
      expect(actions).toEqual(expect.arrayContaining(['CREATED', 'PAUSED', 'RESUMED', 'COMPLETED']));
    });

    it('an invalid transition (resume on an ACTIVE goal) is rejected', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('invalid-transition'));
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'x', category: 'PERSONAL', type: 'BINARY', linkedTag: `x-${Date.now()}` })
        .expect(201);
      await request(app.getHttpServer()).post(`/goals/${created.body.data.id}/resume`).set(headers).expect(400);
    });

    it('archive then restore returns to the exact prior status, and delete then restore does the same', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('archive-restore'));
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'x', category: 'PERSONAL', type: 'BINARY', linkedTag: `x-${Date.now()}` })
        .expect(201);
      const id = created.body.data.id as string;

      const archived = await request(app.getHttpServer()).post(`/goals/${id}/archive`).set(headers).expect(201);
      expect(archived.body.data.status).toBe('ARCHIVED');
      const restored = await request(app.getHttpServer()).post(`/goals/${id}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');

      const deleted = await request(app.getHttpServer()).delete(`/goals/${id}`).set(headers).expect(200);
      expect(deleted.body.data.status).toBe('DELETED');
      const restoredAgain = await request(app.getHttpServer()).post(`/goals/${id}/restore`).set(headers).expect(201);
      expect(restoredAgain.body.data.status).toBe('ACTIVE');
    });

    it('rejects a mutation without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(headers)
        .send({ title: 'x', category: 'PERSONAL', type: 'BINARY', linkedTag: `x-${Date.now()}` })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/goals/${created.body.data.id}/pause`)
        .set('Cookie', headers.Cookie)
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Ownership and cross-user isolation (Phase 8)', () => {
    it('getOne/update/pause/archive/delete 404 identically for a nonexistent id and another user’s goal', async () => {
      const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('other'));
      const created = await request(app.getHttpServer())
        .post('/goals')
        .set(ownerHeaders)
        .send({ title: 'x', category: 'PERSONAL', type: 'BINARY', linkedTag: `x-${Date.now()}` })
        .expect(201);
      const id = created.body.data.id as string;

      const forReal = await request(app.getHttpServer()).get(`/goals/${id}`).set(otherHeaders).expect(404);
      const forFake = await request(app.getHttpServer()).get('/goals/does-not-exist').set(otherHeaders).expect(404);
      expect(forReal.body.error.code).toBe(forFake.body.error.code);

      await request(app.getHttpServer()).patch(`/goals/${id}`).set(otherHeaders).send({ title: 'hijacked' }).expect(404);
      await request(app.getHttpServer()).post(`/goals/${id}/pause`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/goals/${id}/archive`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).delete(`/goals/${id}`).set(otherHeaders).expect(404);
    });

    it('the goal list never includes another user’s goals', async () => {
      const mineHeaders = await registerAndGetHeaders(app, uniqueEmail('mine'));
      const theirsHeaders = await registerAndGetHeaders(app, uniqueEmail('theirs'));
      await request(app.getHttpServer())
        .post('/goals')
        .set(theirsHeaders)
        .send({ title: 'Theirs', category: 'PERSONAL', type: 'BINARY', linkedTag: `t-${Date.now()}` })
        .expect(201);
      await request(app.getHttpServer())
        .post('/goals')
        .set(mineHeaders)
        .send({ title: 'Mine', category: 'PERSONAL', type: 'BINARY', linkedTag: `m-${Date.now()}` })
        .expect(201);

      const list = await request(app.getHttpServer()).get('/goals').set(mineHeaders).expect(200);
      const titles = (list.body.data.items as { title: string }[]).map((g) => g.title);
      expect(titles).toEqual(['Mine']);
    });

    it('a relationship cannot be created against another user’s goal', async () => {
      const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('rel-owner'));
      const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('rel-other'));
      const mine = await request(app.getHttpServer())
        .post('/goals')
        .set(ownerHeaders)
        .send({ title: 'Mine', category: 'PERSONAL', type: 'BINARY', linkedTag: `m-${Date.now()}` })
        .expect(201);
      const theirs = await request(app.getHttpServer())
        .post('/goals')
        .set(otherHeaders)
        .send({ title: 'Theirs', category: 'PERSONAL', type: 'BINARY', linkedTag: `t-${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/goals/${mine.body.data.id}/relationships`)
        .set(ownerHeaders)
        .send({ goalId: theirs.body.data.id, type: 'RELATED' })
        .expect(404);
    });
  });
});
