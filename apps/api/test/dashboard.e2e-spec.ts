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
    .send({ email, displayName: 'Dashboard User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

describe('Dashboard (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app.getHttpServer()).get('/dashboard').expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns a minimal, honest response for a brand-new user', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('dash-new'));

    const res = await request(app.getHttpServer()).get('/dashboard').set(headers).expect(200);

    expect(res.body.data.memoryHighlight).toBeNull();
    expect(res.body.data.companionPanel.previewMessages).toEqual([]);
    expect(res.body.data.hero.greeting).toContain('Dashboard User');
    // Never fabricate memory/report content for a user with none yet.
    expect(JSON.stringify(res.body.data)).not.toMatch(/report/i);
    // Sprint 8.5 remediation: a user who hasn't tried Discovery yet is pointed at it, not at an
    // empty Companion chat — see DashboardService's `hasTriedDiscovery` branch.
    expect(res.body.data.hero.ctaHref).toBe('/discover');
  });

  it('points the hero CTA at Companion once the user has tried Discovery', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('dash-discovered'));

    await request(app.getHttpServer())
      .post('/numerology/calculate')
      .set(headers)
      .send({ fullBirthName: 'Dashboard User', birthDate: '1990-01-01' })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/dashboard').set(headers).expect(200);
    expect(res.body.data.hero.ctaHref).toBe('/companion');
  });

  it('reflects real memory and activity once onboarding is completed', async () => {
    const email = uniqueEmail('dash-complete');
    const headers = await registerAndGetHeaders(app, email);

    await request(app.getHttpServer()).get('/onboarding').set(headers).expect(200);
    await request(app.getHttpServer())
      .post('/onboarding/message')
      .set(headers)
      .send({ content: 'Starting a new job next week and feeling nervous about it.' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/onboarding/message')
      .set(headers)
      .send({ content: 'Whether I will be good enough at it.' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/onboarding/memory/consent')
      .set(headers)
      .send({ accepted: true })
      .expect(201);
    await request(app.getHttpServer())
      .post('/onboarding/discovery/select')
      .set(headers)
      .send({ choice: 'skipped' })
      .expect(201);
    await request(app.getHttpServer()).post('/onboarding/complete').set(headers).expect(201);

    const res = await request(app.getHttpServer()).get('/dashboard').set(headers).expect(200);

    expect(res.body.data.memoryHighlight).not.toBeNull();
    expect(res.body.data.memoryHighlight.content).toContain('new job');
    expect(res.body.data.recentActivity.some((a: { type: string }) => a.type === 'onboarding_completed')).toBe(
      true,
    );
    expect(res.body.data.recentActivity.some((a: { type: string }) => a.type === 'account_created')).toBe(true);
  });
});
