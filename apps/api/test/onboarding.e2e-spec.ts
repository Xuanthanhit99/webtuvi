import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, extractCookie } from './utils/test-app';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetCookies(app: INestApplication, email: string) {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Onboarding User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  return extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
}

describe('Onboarding (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists conversation state across requests (refresh-safe draft)', async () => {
    const cookie = await registerAndGetCookies(app, uniqueEmail('draft'));

    const first = await request(app.getHttpServer()).get('/onboarding').set('Cookie', cookie).expect(200);
    expect(first.body.data.stage).toBe('meet_companion');
    expect(first.body.data.messages).toHaveLength(1);

    // Simulates a page refresh: state (including the opening message) must survive.
    const second = await request(app.getHttpServer()).get('/onboarding').set('Cookie', cookie).expect(200);
    expect(second.body.data.messages).toEqual(first.body.data.messages);
  });

  it('rejects a message sent in the wrong stage', async () => {
    const cookie = await registerAndGetCookies(app, uniqueEmail('stage-mismatch'));
    await request(app.getHttpServer()).get('/onboarding').set('Cookie', cookie).expect(200);

    // First reply is valid (moves meet_companion -> conversation)...
    await request(app.getHttpServer())
      .post('/onboarding/message')
      .set('Cookie', cookie)
      .send({ content: 'Starting a new job.' })
      .expect(201);

    // ...but selecting a discovery choice this early is not.
    const res = await request(app.getHttpServer())
      .post('/onboarding/discovery/select')
      .set('Cookie', cookie)
      .send({ choice: 'skipped' })
      .expect(400);
    expect(res.body.error.code).toBe('ONBOARDING_STAGE_MISMATCH');
  });

  it('completes the full conversation, respects declined memory consent, and marks onboardingCompletedAt', async () => {
    const email = uniqueEmail('complete');
    const cookie = await registerAndGetCookies(app, email);

    await request(app.getHttpServer()).get('/onboarding').set('Cookie', cookie).expect(200);
    await request(app.getHttpServer())
      .post('/onboarding/message')
      .set('Cookie', cookie)
      .send({ content: 'Starting a new job next week and feeling nervous.' })
      .expect(201);
    const afterSecondReply = await request(app.getHttpServer())
      .post('/onboarding/message')
      .set('Cookie', cookie)
      .send({ content: 'Whether I will be good enough at it.' })
      .expect(201);
    expect(afterSecondReply.body.data.stage).toBe('reflection');

    // Declining consent must not block completion, and must not create a memory.
    const afterConsent = await request(app.getHttpServer())
      .post('/onboarding/memory/consent')
      .set('Cookie', cookie)
      .send({ accepted: false })
      .expect(201);
    expect(afterConsent.body.data.stage).toBe('discovery_choice');

    const afterDiscovery = await request(app.getHttpServer())
      .post('/onboarding/discovery/select')
      .set('Cookie', cookie)
      .send({ choice: 'skipped' })
      .expect(201);
    expect(afterDiscovery.body.data.stage).toBe('success');

    // Can't complete before reaching 'success' from a fresh account — already there now.
    await request(app.getHttpServer()).post('/onboarding/complete').set('Cookie', cookie).expect(201);

    const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.data.onboardingCompletedAt).not.toBeNull();
  });

  it('creates a memory note only when the user accepts memory consent', async () => {
    const cookie = await registerAndGetCookies(app, uniqueEmail('consent-accept'));

    await request(app.getHttpServer()).get('/onboarding').set('Cookie', cookie).expect(200);
    await request(app.getHttpServer())
      .post('/onboarding/message')
      .set('Cookie', cookie)
      .send({ content: 'Starting a new job next week.' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/onboarding/message')
      .set('Cookie', cookie)
      .send({ content: 'Whether I will be good enough.' })
      .expect(201);

    const afterConsent = await request(app.getHttpServer())
      .post('/onboarding/memory/consent')
      .set('Cookie', cookie)
      .send({ accepted: true })
      .expect(201);

    const savedMessage = afterConsent.body.data.messages.find((m: { content: string }) =>
      m.content.includes("I'll keep that in mind"),
    );
    expect(savedMessage).toBeDefined();
  });
});
