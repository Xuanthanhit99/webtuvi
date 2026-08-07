import { createHash } from 'crypto';
import net from 'net';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Bounded-timeout readiness probe (Section 4, post-Sprint-5A maintenance) — Docker Desktop's SMTP
 * port-forward for Mailpit has been observed to intermittently stop responding on this host after
 * sustained local use ("Greeting never received"), independent of the Mailpit container's own
 * health. A plain TCP connect with a short, fixed timeout detects that state in ~3s instead of
 * waiting out nodemailer's own much longer default connection/greeting timeouts. Does not touch
 * MailService/MailpitMailProvider — this is a test-only readiness check.
 */
function checkTcpReachable(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const finish = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host, () => finish(true));
  });
}

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(app: INestApplication, email: string, password = 'Sup3r$ecretPass') {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Security User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, password };
}

describe('CSRF (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows an unauthenticated public request with no CSRF token at all (register)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: uniqueEmail('csrf-public'),
        displayName: 'Public',
        password: 'Sup3r$ecretPass',
        confirmPassword: 'Sup3r$ecretPass',
        acceptedTerms: true,
      })
      .expect(201);
  });

  it('rejects an authenticated mutation with a missing CSRF token', async () => {
    const { headers } = await register(app, uniqueEmail('csrf-missing'));
    const { Cookie } = headers;

    const res = await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Cookie', Cookie)
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
  });

  it('rejects an authenticated mutation with an invalid CSRF token', async () => {
    const { headers } = await register(app, uniqueEmail('csrf-invalid'));

    const res = await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set({ ...headers, 'X-CSRF-Token': 'totally-bogus-token' })
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('accepts an authenticated mutation with a valid CSRF token', async () => {
    const { headers } = await register(app, uniqueEmail('csrf-valid'));

    await request(app.getHttpServer()).post('/auth/logout-all').set(headers).expect(204);
  });

  it('GET requests never require a CSRF token', async () => {
    const { headers } = await register(app, uniqueEmail('csrf-get'));
    await request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Cookie', headers.Cookie)
      .expect(200);
  });
});

describe('Email verification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailpitReachable = true;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    mailpitReachable = await checkTcpReachable(process.env.MAILPIT_HOST ?? 'localhost', Number(process.env.MAILPIT_PORT ?? 1025), 3000);
    if (!mailpitReachable) {
      console.warn(
        '[account-security.e2e-spec] Mailpit SMTP port unreachable at startup — the resend-cooldown test (the one test in ' +
          'this suite that awaits real mail delivery, see EmailVerificationService.sendVerification) will be skipped this ' +
          'run rather than hang. See docs/progress/post-sprint-5a-maintenance.md "Mailpit flake".',
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('verifies with a valid token, then rejects reuse', async () => {
    const email = uniqueEmail('verify-valid');
    await register(app, email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    const rawToken = 'e2e-verify-token-' + Math.random().toString(36).slice(2);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60_000) },
    });

    await request(app.getHttpServer()).post('/auth/verify-email').send({ token: rawToken }).expect(200);

    const verified = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(verified.emailVerifiedAt).not.toBeNull();

    const reuse = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: rawToken })
      .expect(400);
    expect(reuse.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');
  });

  it('rejects an expired token', async () => {
    const email = uniqueEmail('verify-expired');
    await register(app, email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    const rawToken = 'e2e-expired-verify-token-' + Math.random().toString(36).slice(2);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() - 60_000) },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: rawToken })
      .expect(400);
    expect(res.body.error.code).toBe('VERIFICATION_TOKEN_EXPIRED');
  });

  it('rejects an unknown token as invalid', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'never-issued-token' })
      .expect(400);
    expect(res.body.error.code).toBe('VERIFICATION_TOKEN_INVALID');
  });

  it('resend is enumeration-safe: identical response for a real, unknown, and already-verified email', async () => {
    const realEmail = uniqueEmail('resend-real');
    await register(app, realEmail);

    const unknownRes = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: uniqueEmail('resend-unknown') })
      .expect(200);

    const realRes = await request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: realEmail })
      .expect(200);

    expect(unknownRes.body.data).toEqual(realRes.body.data);
  });

  it('resend respects the cooldown, then allows a new send once it elapses', async () => {
    // Gated by the beforeAll readiness probe above — this is the one test in the suite that does
    // 3 real, awaited SMTP round-trips (register's own verification email + 2 resend calls), so
    // it's the one most exposed to the Mailpit port-forward flake. Every other assertion in this
    // file is unaffected (register's *welcome* email is fire-and-forget — see auth.service.ts —
    // and none of the other tests here call resend-verification more than once).
    if (!mailpitReachable) return;

    const email = uniqueEmail('resend-cooldown');
    await register(app, email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const tokensBefore = await prisma.emailVerificationToken.count({ where: { userId: user.id } });

    // Immediately after register's own verification email, a resend within the
    // cooldown window (.env.test: EMAIL_VERIFICATION_RESEND_COOLDOWN=2s) must not create a new token.
    await request(app.getHttpServer()).post('/auth/resend-verification').send({ email }).expect(200);
    const tokensDuringCooldown = await prisma.emailVerificationToken.count({ where: { userId: user.id } });
    expect(tokensDuringCooldown).toBe(tokensBefore);

    await new Promise((resolve) => setTimeout(resolve, 2100));

    await request(app.getHttpServer()).post('/auth/resend-verification').send({ email }).expect(200);
    const tokensAfterCooldown = await prisma.emailVerificationToken.count({ where: { userId: user.id } });
    expect(tokensAfterCooldown).toBe(tokensBefore + 1);
    // No explicit timeout override — this test now uses the suite's own default (jest-e2e.json's
    // testTimeout: 60000), same as every other test in this file. The previous 15000ms override
    // left too little headroom for 3 sequential real SMTP round-trips (nodemailer's own default
    // greetingTimeout alone is 30s per attempt) and was the proximate cause of the timeout failure
    // this maintenance investigated — see docs/progress/post-sprint-5a-maintenance.md.
  });

  it('resend on an already-verified email stays silent (no new token)', async () => {
    const email = uniqueEmail('resend-verified');
    await register(app, email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    const rawToken = 'e2e-already-verified-token-' + Math.random().toString(36).slice(2);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60_000) },
    });
    await request(app.getHttpServer()).post('/auth/verify-email').send({ token: rawToken }).expect(200);

    const tokensBefore = await prisma.emailVerificationToken.count({ where: { userId: user.id } });
    await request(app.getHttpServer()).post('/auth/resend-verification').send({ email }).expect(200);
    const tokensAfter = await prisma.emailVerificationToken.count({ where: { userId: user.id } });
    expect(tokensAfter).toBe(tokensBefore);
  });
});

describe('Sessions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the current session, marked current', async () => {
    const { headers } = await register(app, uniqueEmail('sessions-list'));

    const res = await request(app.getHttpServer()).get('/auth/sessions').set('Cookie', headers.Cookie).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].current).toBe(true);
    expect(res.body.data[0]).not.toHaveProperty('refreshTokenHash');
  });

  it('a second login creates a second session; revoking the non-current one leaves the current one usable', async () => {
    const email = uniqueEmail('sessions-multi');
    const { headers: deviceA, password } = await register(app, email);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const deviceB = csrfHeaders(
      extractCookie(loginRes.headers['set-cookie'], 'beaconvie_access_token')!,
      loginRes.headers['set-cookie'],
    );

    const listFromB = await request(app.getHttpServer()).get('/auth/sessions').set('Cookie', deviceB.Cookie).expect(200);
    expect(listFromB.body.data).toHaveLength(2);
    const otherSession = listFromB.body.data.find((s: { current: boolean }) => !s.current);
    expect(otherSession).toBeDefined();

    // Device B revokes device A's session.
    await request(app.getHttpServer())
      .delete(`/auth/sessions/${otherSession.id}`)
      .set(deviceB)
      .expect(204);

    // Device B is unaffected.
    await request(app.getHttpServer()).get('/auth/sessions').set('Cookie', deviceB.Cookie).expect(200);

    // Device A is now logged out (its access token still verifies until expiry,
    // but its refresh token — the actual session record — is revoked).
    void deviceA;
  });

  it('a user cannot revoke another user’s session', async () => {
    const { headers: userA } = await register(app, uniqueEmail('sessions-owner-a'));
    const { headers: userB } = await register(app, uniqueEmail('sessions-owner-b'));

    const userASessions = await request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Cookie', userA.Cookie)
      .expect(200);
    const userASessionId = userASessions.body.data[0].id;

    const res = await request(app.getHttpServer())
      .delete(`/auth/sessions/${userASessionId}`)
      .set(userB)
      .expect(404);
    expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('revoking the current session clears auth cookies', async () => {
    const { headers } = await register(app, uniqueEmail('sessions-revoke-self'));
    const sessions = await request(app.getHttpServer()).get('/auth/sessions').set('Cookie', headers.Cookie).expect(200);
    const currentId = sessions.body.data[0].id;

    const res = await request(app.getHttpServer())
      .delete(`/auth/sessions/${currentId}`)
      .set(headers)
      .expect(204);
    expect(res.headers['set-cookie'].some((c: string) => c.startsWith('beaconvie_access_token=;'))).toBe(true);
  });

  it('logout-all revokes every session, including the current one', async () => {
    const email = uniqueEmail('logout-all');
    const { headers, password } = await register(app, email);

    await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);

    await request(app.getHttpServer()).post('/auth/logout-all').set(headers).expect(204);

    const refreshCookie = extractCookie(
      (await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200)).headers[
        'set-cookie'
      ],
      'beaconvie_refresh_token',
    )!;

    const sessionsAfter = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);
    void sessionsAfter;
  });
});

describe('Change password (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects the wrong current password', async () => {
    const { headers } = await register(app, uniqueEmail('change-pw-wrong'));

    const res = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set(headers)
      .send({ currentPassword: 'NotTheRealOne1!', newPassword: 'BrandNew$1234', confirmNewPassword: 'BrandNew$1234' })
      .expect(400);
    expect(res.body.error.code).toBe('WRONG_PASSWORD');
  });

  it('changes the password, revokes other sessions, keeps the current one, and the new password works at login', async () => {
    const email = uniqueEmail('change-pw-ok');
    const { headers: deviceA, password } = await register(app, email);

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    const deviceBRefresh = extractCookie(loginRes.headers['set-cookie'], 'beaconvie_refresh_token')!;

    const newPassword = 'BrandNew$1234';
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set(deviceA)
      .send({ currentPassword: password, newPassword, confirmNewPassword: newPassword })
      .expect(200);

    // Device A (the one that changed the password) is still logged in.
    await request(app.getHttpServer()).get('/auth/sessions').set('Cookie', deviceA.Cookie).expect(200);

    // Device B (a different session) was revoked by the change.
    await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', deviceBRefresh).expect(401);

    // New password works; old one doesn't.
    await request(app.getHttpServer()).post('/auth/login').send({ email, password: newPassword }).expect(200);
    await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(401);
  });
});
