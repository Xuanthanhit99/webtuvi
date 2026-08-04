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
    .send({ email, displayName: 'Companion Memory User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

/** Reads a supertest SSE response body as raw text (superagent doesn't buffer text/event-stream by default). */
function sseRequest(app: INestApplication, url: string, headers: Record<string, string>) {
  return request(app.getHttpServer())
    .get(url)
    .set(headers)
    .buffer(true)
    .parse((res, callback) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString('utf8');
      });
      res.on('end', () => callback(null, data));
    });
}

/** Extracts and parses the `done` event's JSON payload from a raw SSE response body. */
function parseDoneEvent(sseBody: string): { message: { id: string; role: string }; memoryUsage?: unknown } {
  const match = /^event: done\n(?:id: .+\n)?data: (.+)$/m.exec(sseBody);
  if (!match) throw new Error(`No 'done' event found in SSE body:\n${sseBody}`);
  return JSON.parse(match[1]!);
}

async function createConversationWithMessage(app: INestApplication, headers: Record<string, string>, content: string) {
  const conversation = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
  const conversationId = conversation.body.data.id;
  const sent = await request(app.getHttpServer())
    .post(`/companion/conversations/${conversationId}/messages`)
    .set(headers)
    .send({ content })
    .expect(201);
  return { conversationId, sendResult: sent.body.data as Record<string, unknown> };
}

/** Proposes + accepts a memory directly via the Sprint 3A Memory API (the same mechanism the
 * "Remember" suggestion button uses) so retrieval-focused tests don't depend on the suggestion
 * detector's exact wording matching. */
async function acceptMemory(
  app: INestApplication,
  headers: Record<string, string>,
  opts: { type: string; title: string; summary: string; sourceContent: string },
): Promise<{ memoryId: string; sourceConversationId: string; sourceMessageId: string }> {
  const { conversationId, sendResult } = await createConversationWithMessage(app, headers, opts.sourceContent);
  const sourceMessageId = (sendResult.userMessage as { id: string }).id;

  const proposed = await request(app.getHttpServer())
    .post('/memory/candidates')
    .set(headers)
    .send({
      proposedType: opts.type,
      proposedTitle: opts.title,
      proposedSummary: opts.summary,
      sourceConversationId: conversationId,
      sourceMessageId,
    })
    .expect(201);

  const accepted = await request(app.getHttpServer())
    .post(`/memory/candidates/${proposed.body.data.id}/accept`)
    .set(headers)
    .expect(201);

  return { memoryId: accepted.body.data.memory.id, sourceConversationId: conversationId, sourceMessageId };
}

/** Opens a fresh conversation, sends a neutral message (matches none of the suggestion/forget
 * detectors), and streams the reply — the "later conversation" half of the retrieval flow. */
async function streamInNewConversation(app: INestApplication, headers: Record<string, string>, content = 'How is everything going today?') {
  const { conversationId } = await createConversationWithMessage(app, headers, content);
  const streamRes = await sseRequest(app, `/companion/conversations/${conversationId}/messages/stream`, headers).expect(200);
  const done = parseDoneEvent(String(streamRes.body));
  return { conversationId, done };
}

describe('Companion + Memory Integration (e2e, Sprint 3C)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Suggestion -> accept -> later retrieval -> explanation', () => {
    it('a real user message produces a memory suggestion referencing that real, user-authored message; accepting it creates exactly one Memory, and accepting again is idempotent', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('suggest'));
      const { conversationId, sendResult } = await createConversationWithMessage(
        app,
        headers,
        'I want to run a marathon by the end of this year.',
      );

      const suggestion = sendResult.memorySuggestion as { type: string; title: string; summary: string; reason: string } | null;
      expect(suggestion).not.toBeNull();
      expect(suggestion!.type).toBe('GOAL');
      expect(suggestion!.reason.length).toBeGreaterThan(0);

      const sourceMessageId = (sendResult.userMessage as { id: string }).id;

      // "Remember" — the frontend's exact propose+accept sequence, using the suggestion's own
      // fields and the real message that produced it as the source. A 201 here is itself proof
      // the suggestion traced to a real, owned, USER-authored message (propose() 404s otherwise).
      const proposed = await request(app.getHttpServer())
        .post('/memory/candidates')
        .set(headers)
        .send({
          proposedType: suggestion!.type,
          proposedTitle: suggestion!.title,
          proposedSummary: suggestion!.summary,
          sourceConversationId: conversationId,
          sourceMessageId,
          reason: suggestion!.reason,
        })
        .expect(201);

      const first = await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(201);
      const second = await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(201);
      expect(first.body.data.memory.id).toBe(second.body.data.memory.id);

      const list = await request(app.getHttpServer()).get('/memory').set(headers).expect(200);
      expect(list.body.data.items.filter((m: { id: string }) => m.id === first.body.data.memory.id)).toHaveLength(1);
    });

    it('a later conversation retrieves the accepted memory; the reference carries correct id + full metadata, and the explanation is real (never "I always remember")', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('retrieve'));
      const { memoryId, sourceConversationId } = await acceptMemory(app, headers, {
        type: 'GOAL',
        title: 'Marathon goal',
        summary: 'Training to run a marathon by the end of the year.',
        sourceContent: 'My goal is to run a marathon by the end of the year.',
      });

      const { conversationId: laterConversationId, done } = await streamInNewConversation(app, headers);
      const memoryUsage = done.memoryUsage as { used: Record<string, unknown>[] };
      const used = memoryUsage.used.find((u) => u.memoryId === memoryId);
      expect(used).toBeDefined();
      expect(used).toMatchObject({
        memoryId,
        title: 'Marathon goal',
        type: 'GOAL',
        sourceConversationId,
      });
      expect(typeof used!.reason).toBe('string');
      expect(['PINNED', 'CONTEXT_MATCH', 'IMPORTANCE_RANKED']).toContain(used!.retrievalType);
      expect(typeof used!.retrievalTimestamp).toBe('string');
      expect(typeof used!.createdAt).toBe('string');
      expect(used!.importance).toMatchObject({ score: expect.any(Number), explanations: expect.any(Array) });

      // Persisted on the assistant message too — "later retrieval" still holds after reload,
      // not only in the ephemeral SSE payload.
      const assistantMessageId = (done.message as { id: string }).id;
      const detail = await request(app.getHttpServer()).get(`/companion/conversations/${laterConversationId}`).set(headers).expect(200);
      const persistedAssistant = detail.body.data.messages.find((m: { id: string }) => m.id === assistantMessageId);
      expect(persistedAssistant.memoryUsed.some((r: { memoryId: string }) => r.memoryId === memoryId)).toBe(true);

      const explanation = await request(app.getHttpServer())
        .get(`/companion/conversations/${laterConversationId}/messages/${assistantMessageId}/memory-explanation/${memoryId}`)
        .set(headers)
        .expect(200);
      expect(explanation.body.data.headline).not.toMatch(/i always remember/i);
      expect(explanation.body.data.headline.length).toBeGreaterThan(0);
      expect(explanation.body.data.reason.length).toBeGreaterThan(0);
      expect(explanation.body.data.source.length).toBeGreaterThan(0);
      expect(explanation.body.data.consent.length).toBeGreaterThan(0);
      expect(explanation.body.data.importance).toMatchObject({ score: expect.any(Number) });
    }, 20000);
  });

  describe('Consent enforcement at retrieval time', () => {
    it('disabling memory consent (global DISABLED) prevents retrieval of a previously-accepted memory', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('consent-disabled'));
      const { memoryId } = await acceptMemory(app, headers, {
        type: 'PREFERENCE',
        title: 'Coffee preference',
        summary: 'Really likes oat-milk lattes.',
        sourceContent: 'I really like oat-milk lattes.',
      });

      await request(app.getHttpServer()).put('/memory/consents').set(headers).send({ mode: 'DISABLED' }).expect(200);

      const { done } = await streamInNewConversation(app, headers);
      const memoryUsage = done.memoryUsage as { used: Record<string, unknown>[] };
      expect(memoryUsage.used.some((u) => u.memoryId === memoryId)).toBe(false);

      // The memory row itself still exists — DISABLED blocks retrieval, not the underlying data.
      await request(app.getHttpServer()).get(`/memory/${memoryId}`).set(headers).expect(200);
    }, 20000);

    it('a per-type denial (DENY_TYPE) prevents retrieval of memories of that type only', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('consent-type-denied'));
      const { memoryId } = await acceptMemory(app, headers, {
        type: 'WORK',
        title: 'New job',
        summary: 'Started a new job this month.',
        sourceContent: 'I started a new job this month.',
      });

      await request(app.getHttpServer()).patch('/memory/consents/WORK').set(headers).send({ mode: 'DENY_TYPE' }).expect(200);

      const { done } = await streamInNewConversation(app, headers);
      const memoryUsage = done.memoryUsage as { used: Record<string, unknown>[] };
      expect(memoryUsage.used.some((u) => u.memoryId === memoryId)).toBe(false);
    }, 20000);

    it('HEALTH memories are retrieved only with explicit HEALTH consent, re-checked at retrieval time even after acceptance', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('health-consent'));
      await request(app.getHttpServer()).put('/memory/consents').set(headers).send({ mode: 'ALLOW_TYPE' }).expect(200);
      await request(app.getHttpServer()).patch('/memory/consents/HEALTH').set(headers).send({ mode: 'ALLOW_TYPE' }).expect(200);

      const { memoryId } = await acceptMemory(app, headers, {
        type: 'HEALTH',
        title: 'Migraine pattern',
        summary: 'Gets migraines triggered by poor sleep.',
        sourceContent: 'I get migraines when I don’t sleep enough.',
      });

      const firstRetrieval = await streamInNewConversation(app, headers);
      const usedFirst = (firstRetrieval.done.memoryUsage as { used: Record<string, unknown>[] }).used;
      expect(usedFirst.some((u) => u.memoryId === memoryId)).toBe(true);

      // Revoke HEALTH consent specifically (global stays ALLOW_TYPE) — retrieval must stop
      // immediately, proving the check happens at retrieval time, not only at acceptance time.
      await request(app.getHttpServer()).patch('/memory/consents/HEALTH').set(headers).send({ mode: 'ASK_EVERY_TIME' }).expect(200);

      const secondRetrieval = await streamInNewConversation(app, headers);
      const usedSecond = (secondRetrieval.done.memoryUsage as { used: Record<string, unknown>[] }).used;
      expect(usedSecond.some((u) => u.memoryId === memoryId)).toBe(false);
    }, 30000);
  });

  describe('Archived / deleted / cross-user exclusion at retrieval time', () => {
    it('an archived memory is not retrieved', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('archived'));
      const { memoryId } = await acceptMemory(app, headers, {
        type: 'GOAL',
        title: 'Read more books',
        summary: 'Wants to read one book a month.',
        sourceContent: 'My goal is to read one book a month.',
      });

      await request(app.getHttpServer()).post(`/memory/${memoryId}/archive`).set(headers).expect(201);

      const { done } = await streamInNewConversation(app, headers);
      const used = (done.memoryUsage as { used: Record<string, unknown>[] }).used;
      expect(used.some((u) => u.memoryId === memoryId)).toBe(false);
    }, 20000);

    it('a deleted memory is not retrieved', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('deleted'));
      const { memoryId } = await acceptMemory(app, headers, {
        type: 'GOAL',
        title: 'Learn guitar',
        summary: 'Wants to learn to play guitar.',
        sourceContent: 'My goal is to learn to play guitar.',
      });

      await request(app.getHttpServer()).delete(`/memory/${memoryId}`).set(headers).expect(204);

      const { done } = await streamInNewConversation(app, headers);
      const used = (done.memoryUsage as { used: Record<string, unknown>[] }).used;
      expect(used.some((u) => u.memoryId === memoryId)).toBe(false);
    }, 20000);

    it('another user never retrieves someone else’s memory', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('cross-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('cross-other'));
      const { memoryId } = await acceptMemory(app, owner, {
        type: 'GOAL',
        title: 'Learn Japanese',
        summary: 'Working toward JLPT N3.',
        sourceContent: 'My goal is to learn Japanese and pass JLPT N3.',
      });

      const { done } = await streamInNewConversation(app, other);
      const used = (done.memoryUsage as { used: Record<string, unknown>[] }).used;
      expect(used.some((u) => u.memoryId === memoryId)).toBe(false);
      expect(used).toHaveLength(0);
    }, 20000);
  });

  describe('Forget flow', () => {
    it('a detected "forget that" intent maps only to the caller’s own most-recent memory from that conversation, and confirming deletes only it', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('forget-recent'));
      const { memoryId, sourceConversationId } = await acceptMemory(app, headers, {
        type: 'GOAL',
        title: 'Save for a trip',
        summary: 'Saving money for a trip abroad.',
        sourceContent: 'My goal is to save money for a trip abroad.',
      });

      const forgetMsg = await request(app.getHttpServer())
        .post(`/companion/conversations/${sourceConversationId}/messages`)
        .set(headers)
        .send({ content: 'Actually, forget that.' })
        .expect(201);

      const forgetSuggestion = forgetMsg.body.data.forgetSuggestion as { kind: string; candidates: { memoryId: string }[] } | null;
      expect(forgetSuggestion).not.toBeNull();
      expect(forgetSuggestion!.kind).toBe('FORGET_RECENT');
      expect(forgetSuggestion!.candidates.map((c) => c.memoryId)).toEqual([memoryId]);

      await request(app.getHttpServer())
        .post('/companion/memory-forget/confirm-delete')
        .set(headers)
        .send({ memoryIds: [memoryId] })
        .expect(204);

      await request(app.getHttpServer()).get(`/memory/${memoryId}`).set(headers).expect(404);
    });

    it('an ambiguous "delete everything about X" match (multiple candidates) deletes nothing until explicitly confirmed, and confirming without a target never deletes an unlisted memory', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('forget-ambiguous'));
      const first = await acceptMemory(app, headers, {
        type: 'GOAL',
        title: 'Marathon training plan',
        summary: 'Following a marathon training plan this fall.',
        sourceContent: 'My goal is to follow a marathon training plan this fall.',
      });
      const second = await acceptMemory(app, headers, {
        type: 'HABIT',
        title: 'Weekend marathon training runs',
        summary: 'Does marathon training runs every weekend.',
        sourceContent: 'I really like doing marathon training runs every weekend.',
      });

      const { conversationId } = await createConversationWithMessage(app, headers, 'x');
      const forgetMsg = await request(app.getHttpServer())
        .post(`/companion/conversations/${conversationId}/messages`)
        .set(headers)
        .send({ content: 'Delete everything about marathon training.' })
        .expect(201);

      const forgetSuggestion = forgetMsg.body.data.forgetSuggestion as { kind: string; candidates: { memoryId: string }[] };
      expect(forgetSuggestion.kind).toBe('DELETE_ABOUT');
      expect(forgetSuggestion.candidates.length).toBeGreaterThanOrEqual(2);
      const candidateIds = forgetSuggestion.candidates.map((c) => c.memoryId);
      expect(candidateIds).toEqual(expect.arrayContaining([first.memoryId, second.memoryId]));

      // Detection alone never deletes anything — both memories are still fully intact.
      await request(app.getHttpServer()).get(`/memory/${first.memoryId}`).set(headers).expect(200);
      await request(app.getHttpServer()).get(`/memory/${second.memoryId}`).set(headers).expect(200);

      // Confirming only one of the two listed candidates deletes only that one — no destructive
      // action is ever inferred beyond exactly what the client explicitly sent.
      await request(app.getHttpServer())
        .post('/companion/memory-forget/confirm-delete')
        .set(headers)
        .send({ memoryIds: [first.memoryId] })
        .expect(204);

      await request(app.getHttpServer()).get(`/memory/${first.memoryId}`).set(headers).expect(404);
      await request(app.getHttpServer()).get(`/memory/${second.memoryId}`).set(headers).expect(200);
    });

    it('confirm-delete targets only the caller’s own memory — another user’s memory is untouched (same silent-no-op ownership semantics as DELETE /memory/:id)', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('forget-owner'));
      const attacker = await registerAndGetHeaders(app, uniqueEmail('forget-attacker'));
      const { memoryId } = await acceptMemory(app, owner, {
        type: 'GOAL',
        title: 'Not yours',
        summary: 'A memory belonging to someone else.',
        sourceContent: 'My goal is something that belongs to someone else.',
      });

      await request(app.getHttpServer())
        .post('/companion/memory-forget/confirm-delete')
        .set(attacker)
        .send({ memoryIds: [memoryId] })
        .expect(204);

      await request(app.getHttpServer()).get(`/memory/${memoryId}`).set(owner).expect(200);
    });

    it('"never remember this type" (forget-intent) requires explicit confirmation and only then changes consent', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('forget-never-type'));
      const { conversationId } = await createConversationWithMessage(app, headers, 'x');

      const msg = await request(app.getHttpServer())
        .post(`/companion/conversations/${conversationId}/messages`)
        .set(headers)
        .send({ content: 'Please never remember my work stuff again.' })
        .expect(201);

      const forgetSuggestion = msg.body.data.forgetSuggestion as { kind: string; type: string };
      expect(forgetSuggestion.kind).toBe('NEVER_REMEMBER_TYPE');
      expect(forgetSuggestion.type).toBe('WORK');

      // Detected but not yet confirmed: consent has not changed yet.
      const beforeConsents = await request(app.getHttpServer()).get('/memory/consents').set(headers).expect(200);
      const workBefore = beforeConsents.body.data.typeOverrides?.find((t: { type: string }) => t.type === 'WORK');
      expect(workBefore?.mode).not.toBe('DENY_TYPE');

      await request(app.getHttpServer())
        .post('/companion/memory-forget/confirm-never-remember')
        .set(headers)
        .send({ type: 'WORK' })
        .expect(204);

      const afterConsents = await request(app.getHttpServer()).get('/memory/consents').set(headers).expect(200);
      const workAfter = afterConsents.body.data.typeOverrides?.find((t: { type: string }) => t.type === 'WORK');
      expect(workAfter?.mode).toBe('DENY_TYPE');
    });
  });

  describe('CSRF on memory mutations reached via Companion', () => {
    it('rejects confirm-delete without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf-confirm-delete'));
      const res = await request(app.getHttpServer())
        .post('/companion/memory-forget/confirm-delete')
        .set('Cookie', headers.Cookie)
        .send({ memoryIds: ['does-not-matter'] })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('rejects confirm-never-remember without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf-confirm-never'));
      const res = await request(app.getHttpServer())
        .post('/companion/memory-forget/confirm-never-remember')
        .set('Cookie', headers.Cookie)
        .send({ type: 'GOAL' })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('rejects dismiss-suggestion without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf-dismiss'));
      const res = await request(app.getHttpServer())
        .post('/companion/memory-suggestions/dismiss')
        .set('Cookie', headers.Cookie)
        .send({ type: 'GOAL' })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('No duplicate persistence', () => {
    it('one streamed turn persists exactly one assistant message, whether or not memory was used', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('no-duplicate'));
      await acceptMemory(app, headers, {
        type: 'GOAL',
        title: 'Keep a journal',
        summary: 'Wants to keep a daily journal.',
        sourceContent: 'My goal is to keep a daily journal.',
      });

      const { conversationId } = await streamInNewConversation(app, headers);
      const detail = await request(app.getHttpServer()).get(`/companion/conversations/${conversationId}`).set(headers).expect(200);
      expect(detail.body.data.messages).toHaveLength(2);
      expect(detail.body.data.messages.filter((m: { role: string }) => m.role === 'assistant')).toHaveLength(1);
    }, 20000);
  });
});
