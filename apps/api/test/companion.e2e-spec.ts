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
    .send({ email, displayName: 'Companion User', password, confirmPassword: password, acceptedTerms: true })
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

describe('Companion Core (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a conversation, lists it, and reads it back with an empty message history', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('create'));

    const created = await request(app.getHttpServer())
      .post('/companion/conversations')
      .set(headers)
      .send({ title: 'My first chat' })
      .expect(201);
    expect(created.body.data.title).toBe('My first chat');
    expect(created.body.data.status).toBe('active');
    expect(created.body.data.messageCount).toBe(0);

    const list = await request(app.getHttpServer()).get('/companion/conversations').set(headers).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(created.body.data.id);

    const detail = await request(app.getHttpServer())
      .get(`/companion/conversations/${created.body.data.id}`)
      .set(headers)
      .expect(200);
    expect(detail.body.data.messages).toEqual([]);
  });

  it('rejects creating a conversation without a CSRF token', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
    const res = await request(app.getHttpServer())
      .post('/companion/conversations')
      .set('Cookie', headers.Cookie)
      .send({})
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('a user cannot read, message, or delete another user’s conversation (404, not 403)', async () => {
    const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('owner'));
    const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('other'));

    const created = await request(app.getHttpServer())
      .post('/companion/conversations')
      .set(ownerHeaders)
      .send({})
      .expect(201);
    const id = created.body.data.id;

    const getRes = await request(app.getHttpServer()).get(`/companion/conversations/${id}`).set(otherHeaders).expect(404);
    expect(getRes.body.error.code).toBe('CONVERSATION_NOT_FOUND');

    await request(app.getHttpServer())
      .post(`/companion/conversations/${id}/messages`)
      .set(otherHeaders)
      .send({ content: 'hi' })
      .expect(404);

    await request(app.getHttpServer()).delete(`/companion/conversations/${id}`).set(otherHeaders).expect(404);
  });

  it('sending an ordinary message persists it and requires generation (no assistant reply yet)', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('send-ok'));
    const created = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const id = created.body.data.id;

    const res = await request(app.getHttpServer())
      .post(`/companion/conversations/${id}/messages`)
      .set(headers)
      .send({ content: 'Starting a new job next week and feeling nervous.' })
      .expect(201);

    expect(res.body.data.userMessage.role).toBe('user');
    expect(res.body.data.requiresGeneration).toBe(true);
    expect(res.body.data.assistantMessage).toBeNull();
  });

  it('sending crisis content is refused immediately — no generation required, a safe resource message is persisted', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('send-crisis'));
    const created = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const id = created.body.data.id;

    const res = await request(app.getHttpServer())
      .post(`/companion/conversations/${id}/messages`)
      .set(headers)
      .send({ content: 'I want to kill myself' })
      .expect(201);

    expect(res.body.data.requiresGeneration).toBe(false);
    expect(res.body.data.assistantMessage).not.toBeNull();
    expect(res.body.data.assistantMessage.content).toMatch(/988|crisis/i);

    // The conversation should now show 2 messages, no stream ever needed.
    const detail = await request(app.getHttpServer()).get(`/companion/conversations/${id}`).set(headers).expect(200);
    expect(detail.body.data.messages).toHaveLength(2);
  });

  it('rejects a message over the max length', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('too-long'));
    const created = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .post(`/companion/conversations/${id}/messages`)
      .set(headers)
      .send({ content: 'a'.repeat(5000) })
      .expect(400);
  });

  it('streams a real assistant reply end-to-end using the mock provider, and persists it', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('stream'));
    const created = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .post(`/companion/conversations/${id}/messages`)
      .set(headers)
      .send({ content: 'Starting a new job next week.' })
      .expect(201);

    const streamRes = await sseRequest(app, `/companion/conversations/${id}/messages/stream`, headers).expect(200);

    const sseBody = String(streamRes.body);
    expect(streamRes.headers['content-type']).toMatch(/text\/event-stream/);
    // Assert the actual SSE frame shape a real browser EventSource depends on
    // (a top-level `event: <name>` line) — not just a loose substring match
    // on the JSON, which previously passed even when a global interceptor
    // double-wrapped every MessageEvent and silently broke every named event
    // (caught only by an actual browser-driven Playwright run — see
    // ResponseInterceptor's SSE bypass and its comment for the full story).
    expect(sseBody).toMatch(/^event: token$/m);
    expect(sseBody).toMatch(/^event: done$/m);
    expect(sseBody).not.toMatch(/"data":\{"data":/); // the double-wrap signature, if it ever regresses

    const detail = await request(app.getHttpServer()).get(`/companion/conversations/${id}`).set(headers).expect(200);
    expect(detail.body.data.messages).toHaveLength(2);
    expect(detail.body.data.messages[1].role).toBe('assistant');
    expect(detail.body.data.messages[1].content.length).toBeGreaterThan(0);
  }, 20000);

  it('deletes a conversation', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('delete'));
    const created = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer()).delete(`/companion/conversations/${id}`).set(headers).expect(204);
    await request(app.getHttpServer()).get(`/companion/conversations/${id}`).set(headers).expect(404);
  });

  it('the Dashboard companion preview reflects the new Conversation model', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('dash-preview'));
    const created = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .post(`/companion/conversations/${id}/messages`)
      .set(headers)
      .send({ content: 'Hello there' })
      .expect(201);
    await sseRequest(app, `/companion/conversations/${id}/messages/stream`, headers).expect(200);

    const dashboard = await request(app.getHttpServer()).get('/dashboard').set(headers).expect(200);
    expect(dashboard.body.data.companionPanel.previewMessages.length).toBeGreaterThan(0);
  }, 20000);
});
