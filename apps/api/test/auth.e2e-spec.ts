import { createHash } from 'crypto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AUTH_RATE_LIMIT_MAX } from '../src/common/rate-limit.constants';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const password = 'Sup3r$ecretPass';

  it('registers a new user and returns a safe user DTO (no passwordHash)', async () => {
    const email = uniqueEmail('register');
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Reg User', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);

    expect(res.body.data).toMatchObject({ email, displayName: 'Reg User', onboardingCompletedAt: null });
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')).toBeDefined();
    expect(extractCookie(res.headers['set-cookie'], 'beaconvie_refresh_token')).toBeDefined();
  });

  it('rejects registering the same email twice', async () => {
    const email = uniqueEmail('dup');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Dup', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Dup', password, confirmPassword: password, acceptedTerms: true })
      .expect(409);

    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('rejects a password with no number or symbol', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: uniqueEmail('weak'),
        displayName: 'Weak',
        password: 'alllowercase',
        confirmPassword: 'alllowercase',
        acceptedTerms: true,
      })
      .expect(400);

    expect(res.body.error.details.form[0]).toMatch(/number or symbol/i);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    const email = uniqueEmail('login');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Login User', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPassword1!' })
      .expect(401);
    expect(wrongPassword.body.error.code).toBe('WRONG_PASSWORD');

    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail('unknown'), password })
      .expect(401);
    expect(unknownEmail.body.error.code).toBe('ACCOUNT_NOT_FOUND');

    const ok = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    expect(ok.body.data.email).toBe(email);
  });

  it('returns the current user from /auth/me only with a valid session', async () => {
    const email = uniqueEmail('me');
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Me User', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);
    const accessCookie = extractCookie(registerRes.headers['set-cookie'], 'beaconvie_access_token')!;

    await request(app.getHttpServer()).get('/auth/me').expect(401);

    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', accessCookie)
      .expect(200);
    expect(meRes.body.data.email).toBe(email);
  });

  it('rotates refresh tokens and revokes the whole session family on reuse', async () => {
    const email = uniqueEmail('refresh');
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Refresh User', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);
    const originalRefreshCookie = extractCookie(registerRes.headers['set-cookie'], 'beaconvie_refresh_token')!;

    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', originalRefreshCookie)
      .expect(200);
    const rotatedRefreshCookie = extractCookie(refreshRes.headers['set-cookie'], 'beaconvie_refresh_token')!;
    expect(rotatedRefreshCookie).not.toBe(originalRefreshCookie);

    // Reusing the now-rotated-away original token is treated as theft: revokes the family.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', originalRefreshCookie)
      .expect(401);

    // The legitimate, newest token is now also revoked as a result.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', rotatedRefreshCookie)
      .expect(401);
  });

  it('logout revokes the session so refresh no longer works', async () => {
    const email = uniqueEmail('logout');
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Logout User', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);
    const refreshCookie = extractCookie(registerRes.headers['set-cookie'], 'beaconvie_refresh_token')!;
    const accessCookie = extractCookie(registerRes.headers['set-cookie'], 'beaconvie_access_token')!;
    const headers = csrfHeaders(accessCookie, registerRes.headers['set-cookie']);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set({ ...headers, Cookie: `${refreshCookie}; ${headers.Cookie}` })
      .expect(204);

    await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', refreshCookie).expect(401);
  });

  it('rejects logout without a CSRF token, and rejects a wrong one', async () => {
    const email = uniqueEmail('logout-csrf');
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Logout Csrf', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);
    const refreshCookie = extractCookie(registerRes.headers['set-cookie'], 'beaconvie_refresh_token')!;
    const csrfCookie = extractCookie(registerRes.headers['set-cookie'], 'beaconvie_csrf_token')!;

    const missing = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', refreshCookie)
      .expect(403);
    expect(missing.body.error.code).toBe('CSRF_TOKEN_MISSING');

    const invalid = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', `${refreshCookie}; ${csrfCookie}`)
      .set('X-CSRF-Token', 'not-the-right-token')
      .expect(403);
    expect(invalid.body.error.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('forgot-password responds identically whether or not the email exists', async () => {
    const existing = uniqueEmail('forgot-exists');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: existing, displayName: 'Forgot', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);

    const existsRes = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: existing })
      .expect(200);

    const missingRes = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: uniqueEmail('forgot-missing') })
      .expect(200);

    expect(existsRes.body.data).toEqual(missingRes.body.data);
  });

  it('resets a password with a valid token, then rejects reuse and expired tokens', async () => {
    const email = uniqueEmail('reset');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, displayName: 'Reset User', password, confirmPassword: password, acceptedTerms: true })
      .expect(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const rawToken = 'e2e-test-token-' + Math.random().toString(36).slice(2);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60_000) },
    });

    const newPassword = 'NewSup3r$ecret';
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: rawToken, password: newPassword, confirmPassword: newPassword })
      .expect(200);

    // Reusing the same (now-used) token fails.
    const reuse = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: rawToken, password: newPassword, confirmPassword: newPassword })
      .expect(400);
    expect(reuse.body.error.code).toBe('RESET_TOKEN_EXPIRED');

    // Login works with the new password.
    await request(app.getHttpServer()).post('/auth/login').send({ email, password: newPassword }).expect(200);

    // An expired token is rejected the same way.
    const expiredRawToken = 'e2e-expired-token-' + Math.random().toString(36).slice(2);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(expiredRawToken),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const expiredRes = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: expiredRawToken, password: newPassword, confirmPassword: newPassword })
      .expect(400);
    expect(expiredRes.body.error.code).toBe('RESET_TOKEN_EXPIRED');
  });

  it('rate-limits repeated forgot-password attempts', async () => {
    const email = uniqueEmail('rate-limit');
    let sawTooManyRequests = false;

    // AUTH_RATE_LIMIT_MAX is set high in .env.test (200) so the *other* e2e
    // specs' register/login calls — sharing the same Redis-backed "auth"
    // throttler config — don't trip it. This test derives its own ceiling
    // from that same constant instead of a hard-coded number, so it stays
    // correct regardless of what that value is.
    for (let i = 0; i < AUTH_RATE_LIMIT_MAX + 5; i += 1) {
      const res = await request(app.getHttpServer()).post('/auth/forgot-password').send({ email });
      if (res.status === 429) {
        sawTooManyRequests = true;
        expect(res.body.error.message).toMatch(/too many attempts/i);
        break;
      }
    }

    expect(sawTooManyRequests).toBe(true);
  });

  describe('Phase 02 — Mobile auth (Bearer)', () => {
    it('registers via the mobile endpoint, returns tokens in the body, and sets no cookies', async () => {
      const email = uniqueEmail('mobile-register');
      const res = await request(app.getHttpServer())
        .post('/auth/mobile/register')
        .send({ email, displayName: 'Mobile Reg', password, confirmPassword: password, acceptedTerms: true })
        .expect(201);

      expect(res.body.data.user).toMatchObject({ email, displayName: 'Mobile Reg' });
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
      // The whole point of the mobile transport: no httpOnly cookies at all, unlike /auth/register.
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('logs in via the mobile endpoint with correct credentials and rejects wrong ones, without needing a CSRF token', async () => {
      const email = uniqueEmail('mobile-login');
      await request(app.getHttpServer())
        .post('/auth/mobile/register')
        .send({ email, displayName: 'Mobile Login', password, confirmPassword: password, acceptedTerms: true })
        .expect(201);

      const wrong = await request(app.getHttpServer())
        .post('/auth/mobile/login')
        .send({ email, password: 'WrongPassword1!' })
        .expect(401);
      expect(wrong.body.error.code).toBe('WRONG_PASSWORD');

      // No X-CSRF-Token/csrf cookie sent at all — proves the mobile route needs none.
      const ok = await request(app.getHttpServer()).post('/auth/mobile/login').send({ email, password }).expect(200);
      expect(ok.body.data.user.email).toBe(email);
    });

    it('accepts an Authorization: Bearer access token on the shared /auth/me route — no mobile-specific route needed', async () => {
      const email = uniqueEmail('mobile-me');
      const loginRes = await request(app.getHttpServer())
        .post('/auth/mobile/register')
        .send({ email, displayName: 'Mobile Me', password, confirmPassword: password, acceptedTerms: true })
        .expect(201);

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
        .expect(200);
      expect(meRes.body.data.email).toBe(email);
    });

    it('rotates mobile refresh tokens and revokes the whole family on reuse, same as the web cookie flow', async () => {
      const email = uniqueEmail('mobile-refresh');
      const registerRes = await request(app.getHttpServer())
        .post('/auth/mobile/register')
        .send({ email, displayName: 'Mobile Refresh', password, confirmPassword: password, acceptedTerms: true })
        .expect(201);
      const originalRefreshToken = registerRes.body.data.refreshToken as string;

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/mobile/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect(200);
      const rotatedRefreshToken = refreshRes.body.data.refreshToken as string;
      expect(rotatedRefreshToken).not.toBe(originalRefreshToken);

      // Replaying the rotated-away original is theft-indicative: revokes the whole family.
      await request(app.getHttpServer())
        .post('/auth/mobile/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect(401);
      await request(app.getHttpServer())
        .post('/auth/mobile/refresh')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(401);
    });

    it('mobile logout revokes the session so refresh no longer works', async () => {
      const email = uniqueEmail('mobile-logout');
      const registerRes = await request(app.getHttpServer())
        .post('/auth/mobile/register')
        .send({ email, displayName: 'Mobile Logout', password, confirmPassword: password, acceptedTerms: true })
        .expect(201);
      const refreshToken = registerRes.body.data.refreshToken as string;

      await request(app.getHttpServer()).post('/auth/mobile/logout').send({ refreshToken }).expect(204);
      await request(app.getHttpServer()).post('/auth/mobile/refresh').send({ refreshToken }).expect(401);
    });

    it('rejects a mobile refresh for an unknown/garbage token without revoking anything real', async () => {
      await request(app.getHttpServer())
        .post('/auth/mobile/refresh')
        .send({ refreshToken: 'not-a-real-token' })
        .expect(401);
    });

    it(
      'concurrent refresh with the same token: at most one succeeds — documents the actual ' +
        'behavior of AuthService.refresh()\'s find-then-revoke sequence under a real race, since ' +
        'this cannot be exercised meaningfully by the guard-level unit tests',
      async () => {
        const email = uniqueEmail('mobile-refresh-race');
        const registerRes = await request(app.getHttpServer())
          .post('/auth/mobile/register')
          .send({ email, displayName: 'Race', password, confirmPassword: password, acceptedTerms: true })
          .expect(201);
        const refreshToken = registerRes.body.data.refreshToken as string;

        const [a, b] = await Promise.all([
          request(app.getHttpServer()).post('/auth/mobile/refresh').send({ refreshToken }),
          request(app.getHttpServer()).post('/auth/mobile/refresh').send({ refreshToken }),
        ]);
        const statuses = [a.status, b.status].sort();
        // Exactly one 200 and one 401 is the intended outcome; if this ever observes [200, 200],
        // that's a real reuse-detection race condition worth its own investigation, not something
        // this test should silently accept.
        expect(statuses).toEqual([200, 401]);
      },
    );
  });
});
