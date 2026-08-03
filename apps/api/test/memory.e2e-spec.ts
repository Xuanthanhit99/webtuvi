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
    .send({ email, displayName: 'Memory User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

/** Creates a conversation + one user message, returning ids to use as a real memory candidate source. */
async function createRealSource(app: INestApplication, headers: Record<string, string>) {
  const conversation = await request(app.getHttpServer())
    .post('/companion/conversations')
    .set(headers)
    .send({})
    .expect(201);
  const conversationId = conversation.body.data.id;

  const sent = await request(app.getHttpServer())
    .post(`/companion/conversations/${conversationId}/messages`)
    .set(headers)
    .send({ content: 'Starting a new job next week and feeling nervous about it.' })
    .expect(201);

  return { conversationId, messageId: sent.body.data.userMessage.id };
}

async function proposeAndAccept(app: INestApplication, headers: Record<string, string>) {
  const { conversationId, messageId } = await createRealSource(app, headers);
  const proposed = await request(app.getHttpServer())
    .post('/memory/candidates')
    .set(headers)
    .send({
      proposedType: 'GOAL',
      proposedTitle: 'New job',
      proposedSummary: 'Starting a new job next week.',
      sourceConversationId: conversationId,
      sourceMessageId: messageId,
    })
    .expect(201);

  const accepted = await request(app.getHttpServer())
    .post(`/memory/candidates/${proposed.body.data.id}/accept`)
    .set(headers)
    .expect(201);

  return { candidateId: proposed.body.data.id, memoryId: accepted.body.data.memory.id };
}

describe('Memory Foundation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects proposing a candidate without a CSRF token', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
    const res = await request(app.getHttpServer())
      .post('/memory/candidates')
      .set('Cookie', headers.Cookie)
      .send({ proposedType: 'GOAL', proposedTitle: 'x', proposedSummary: 'x', sourceConversationId: 'x', sourceMessageId: 'x' })
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('rejects a candidate whose source message is not real user-authored content (assistant message, or someone else’s conversation)', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('bad-source'));
    const other = await registerAndGetHeaders(app, uniqueEmail('bad-source-other'));
    const { conversationId } = await createRealSource(app, other);

    await request(app.getHttpServer())
      .post('/memory/candidates')
      .set(headers)
      .send({
        proposedType: 'GOAL',
        proposedTitle: 'Not mine',
        proposedSummary: 'x',
        sourceConversationId: conversationId,
        sourceMessageId: 'does-not-matter',
      })
      .expect(404);
  });

  it('accepting a candidate creates exactly one memory; accepting again does not duplicate it', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('accept-once'));
    const { conversationId, messageId } = await createRealSource(app, headers);
    const proposed = await request(app.getHttpServer())
      .post('/memory/candidates')
      .set(headers)
      .send({ proposedType: 'GOAL', proposedTitle: 'New job', proposedSummary: 'x', sourceConversationId: conversationId, sourceMessageId: messageId })
      .expect(201);

    const first = await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(201);
    const second = await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(201);

    expect(first.body.data.memory.id).toBe(second.body.data.memory.id);

    const list = await request(app.getHttpServer()).get('/memory').set(headers).expect(200);
    expect(list.body.data.items).toHaveLength(1);
  });

  it('a rejected candidate creates no memory', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('reject'));
    const { conversationId, messageId } = await createRealSource(app, headers);
    const proposed = await request(app.getHttpServer())
      .post('/memory/candidates')
      .set(headers)
      .send({ proposedType: 'GOAL', proposedTitle: 'x', proposedSummary: 'x', sourceConversationId: conversationId, sourceMessageId: messageId })
      .expect(201);

    await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/reject`).set(headers).expect(201);

    const list = await request(app.getHttpServer()).get('/memory').set(headers).expect(200);
    expect(list.body.data.items).toHaveLength(0);
  });

  it('a user cannot read, patch, delete, or see another user’s memory (404, not 403)', async () => {
    const owner = await registerAndGetHeaders(app, uniqueEmail('owner'));
    const other = await registerAndGetHeaders(app, uniqueEmail('other'));
    const { memoryId } = await proposeAndAccept(app, owner);

    await request(app.getHttpServer()).get(`/memory/${memoryId}`).set(other).expect(404);
    await request(app.getHttpServer()).patch(`/memory/${memoryId}`).set(other).send({ title: 'hijacked' }).expect(404);
    const otherList = await request(app.getHttpServer()).get('/memory').set(other).expect(200);
    expect(otherList.body.data.items.some((m: { id: string }) => m.id === memoryId)).toBe(false);
  });

  it('deleting someone else’s memory is a silent no-op — the owner can still see it afterward', async () => {
    const owner = await registerAndGetHeaders(app, uniqueEmail('owner2'));
    const other = await registerAndGetHeaders(app, uniqueEmail('other2'));
    const { memoryId } = await proposeAndAccept(app, owner);

    await request(app.getHttpServer()).delete(`/memory/${memoryId}`).set(other).expect(204);
    await request(app.getHttpServer()).get(`/memory/${memoryId}`).set(owner).expect(200);
  });

  it('updating a memory only changes title/visibility and creates a new version', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('update'));
    const { memoryId } = await proposeAndAccept(app, headers);

    // `summary` isn't a field UpdateMemoryDto declares — the global ValidationPipe
    // (whitelist + forbidNonWhitelisted, main.ts) rejects the whole request rather
    // than silently dropping it, so this doubles as proof content can't be smuggled
    // into an update at all, not just that it would've been ignored.
    await request(app.getHttpServer())
      .patch(`/memory/${memoryId}`)
      .set(headers)
      .send({ title: 'Renamed', summary: 'attempted content override' })
      .expect(400);

    const updated = await request(app.getHttpServer())
      .patch(`/memory/${memoryId}`)
      .set(headers)
      .send({ title: 'Renamed' })
      .expect(200);

    expect(updated.body.data.title).toBe('Renamed');
    expect(updated.body.data.summary).toBe('Starting a new job next week.');
    expect(updated.body.data.version).toBe(2);

    const versions = await request(app.getHttpServer()).get(`/memory/${memoryId}/versions`).set(headers).expect(200);
    expect(versions.body.data).toHaveLength(2);
  });

  it('archive hides a memory from the default list; restore reverses it', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('archive'));
    const { memoryId } = await proposeAndAccept(app, headers);

    await request(app.getHttpServer()).post(`/memory/${memoryId}/archive`).set(headers).expect(201);
    const afterArchive = await request(app.getHttpServer()).get('/memory').set(headers).expect(200);
    expect(afterArchive.body.data.items).toHaveLength(0);

    await request(app.getHttpServer()).post(`/memory/${memoryId}/restore`).set(headers).expect(201);
    const afterRestore = await request(app.getHttpServer()).get('/memory').set(headers).expect(200);
    expect(afterRestore.body.data.items).toHaveLength(1);
  });

  it('deleted memory is not retrievable afterward, by the owner or anyone else', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('delete'));
    const { memoryId } = await proposeAndAccept(app, headers);

    await request(app.getHttpServer()).delete(`/memory/${memoryId}`).set(headers).expect(204);
    await request(app.getHttpServer()).get(`/memory/${memoryId}`).set(headers).expect(404);

    // Idempotent — deleting again is not an error.
    await request(app.getHttpServer()).delete(`/memory/${memoryId}`).set(headers).expect(204);
  });

  it('timeline paginates with a cursor and never returns a deleted memory', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('timeline'));
    await proposeAndAccept(app, headers);
    const { memoryId: toDelete } = await proposeAndAccept(app, headers);
    await request(app.getHttpServer()).delete(`/memory/${toDelete}`).set(headers).expect(204);

    const page = await request(app.getHttpServer()).get('/memory/timeline?limit=1').set(headers).expect(200);
    expect(page.body.data.items).toHaveLength(1);
    expect(page.body.data.items[0].id).not.toBe(toDelete);
  });

  it('disabling memory consent blocks accepting a new candidate', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('disabled'));
    await request(app.getHttpServer()).put('/memory/consents').set(headers).send({ mode: 'DISABLED' }).expect(200);

    const { conversationId, messageId } = await createRealSource(app, headers);
    const proposed = await request(app.getHttpServer())
      .post('/memory/candidates')
      .set(headers)
      .send({ proposedType: 'GOAL', proposedTitle: 'x', proposedSummary: 'x', sourceConversationId: conversationId, sourceMessageId: messageId })
      .expect(201);
    expect(proposed.body.data.status).toBe('PENDING_CONSENT');

    await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(403);
  });

  it('HEALTH memories require an explicit per-type consent override, never the global default', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('health'));
    await request(app.getHttpServer()).put('/memory/consents').set(headers).send({ mode: 'ALLOW_TYPE' }).expect(200);

    const { conversationId, messageId } = await createRealSource(app, headers);
    const proposed = await request(app.getHttpServer())
      .post('/memory/candidates')
      .set(headers)
      .send({ proposedType: 'HEALTH', proposedTitle: 'x', proposedSummary: 'x', sourceConversationId: conversationId, sourceMessageId: messageId })
      .expect(201);

    await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(403);

    await request(app.getHttpServer()).patch('/memory/consents/HEALTH').set(headers).send({ mode: 'ALLOW_TYPE' }).expect(200);
    await request(app.getHttpServer()).post(`/memory/candidates/${proposed.body.data.id}/accept`).set(headers).expect(201);
  });

  it('export contains only the caller’s own memories', async () => {
    const owner = await registerAndGetHeaders(app, uniqueEmail('export-owner'));
    const other = await registerAndGetHeaders(app, uniqueEmail('export-other'));
    await proposeAndAccept(app, owner);
    await proposeAndAccept(app, other);

    const job = await request(app.getHttpServer()).post('/memory/export').set(owner).expect(201);
    expect(job.body.data.result.memories).toHaveLength(1);

    const fetched = await request(app.getHttpServer()).get(`/memory/export/${job.body.data.jobId}`).set(owner).expect(200);
    expect(fetched.body.data.result.memories).toHaveLength(1);

    // The other user cannot fetch the owner's export job.
    await request(app.getHttpServer()).get(`/memory/export/${job.body.data.jobId}`).set(other).expect(404);
  });
});
