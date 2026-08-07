import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';

// Sprint 6 — Tarot Discovery Foundation e2e coverage against the real HTTP surface + real seeded
// deck. Mirrors goal.e2e-spec.ts's own helpers/discipline (unique email per test, identical-404
// ownership checks). Runs against the mock AI provider (see .env.test DEFAULT_AI_PROVIDER=mock),
// so `interpretation` is expected to be populated (non-null) after a successful draw.

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Tarot User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

interface TarotCardApi { id: string; slug: string; name: string; arcana: string }
interface TarotReadingCardApi { position: number; positionLabel: string | null; isReversed: boolean; card: TarotCardApi }
interface TarotReadingApi {
  id: string;
  type: string;
  status: string;
  spreadSlug: string;
  question: string | null;
  interpretation: string | null;
  cards: TarotReadingCardApi[];
}

describe('Tarot (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Deck (Phase 1/5)', () => {
    it('lists the full real 78-card deck — no placeholders', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('deck'));
      const res = await request(app.getHttpServer()).get('/tarot/deck').set(headers).expect(200);
      const cards = res.body.data as TarotCardApi[];
      expect(cards).toHaveLength(78);
      expect(new Set(cards.map((c) => c.slug)).size).toBe(78);
      expect(cards.filter((c) => c.arcana === 'MAJOR')).toHaveLength(22);
    });

    it('gets one real card by slug, and 404s for an unknown slug', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('card'));
      const ok = await request(app.getHttpServer()).get('/tarot/deck/major-00-the-fool').set(headers).expect(200);
      expect((ok.body.data as TarotCardApi).name).toBe('The Fool');

      const missing = await request(app.getHttpServer()).get('/tarot/deck/not-a-real-card').set(headers).expect(404);
      expect(missing.body.error.code).toBe('TAROT_CARD_NOT_FOUND');
    });
  });

  describe('Draw (Phase 2/3/4)', () => {
    it('a Single Card draw creates a real reading with a real card and a generated interpretation', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('single'));
      const res = await request(app.getHttpServer())
        .post('/tarot/draw')
        .set(headers)
        .send({ type: 'SINGLE_CARD', question: 'What should I focus on today?' })
        .expect(201);
      const reading = res.body.data as TarotReadingApi;

      expect(reading.status).toBe('ACTIVE');
      expect(reading.spreadSlug).toBe('single-card');
      expect(reading.cards).toHaveLength(1);
      expect(reading.cards[0]!.card.id).toBeTruthy();
      expect(reading.cards[0]!.card.name).toBeTruthy();
      expect(typeof reading.interpretation).toBe('string');
      expect(reading.interpretation!.length).toBeGreaterThan(0);
    });

    it('a Three Card Spread draws 3 unique cards with Past/Present/Future position labels', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('three-card'));
      const res = await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'THREE_CARD' }).expect(201);
      const reading = res.body.data as TarotReadingApi;

      expect(reading.cards).toHaveLength(3);
      const cardIds = reading.cards.map((c) => c.card.id);
      expect(new Set(cardIds).size).toBe(3);
      expect(reading.cards.map((c) => c.positionLabel)).toEqual(['Past', 'Present', 'Future']);
    });

    it('a second Daily Draw the same day is rejected — even after deleting the first one', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('daily'));
      const first = await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'DAILY_DRAW' }).expect(201);
      const reading = first.body.data as TarotReadingApi;

      const secondAttempt = await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'DAILY_DRAW' }).expect(400);
      expect(secondAttempt.body.error.code).toBe('TAROT_DAILY_DRAW_ALREADY_TAKEN');

      await request(app.getHttpServer()).delete(`/tarot/readings/${reading.id}`).set(headers).expect(200);

      const thirdAttempt = await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'DAILY_DRAW' }).expect(400);
      expect(thirdAttempt.body.error.code).toBe('TAROT_DAILY_DRAW_ALREADY_TAKEN');
    });

    it('rejects a draw without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
      const res = await request(app.getHttpServer())
        .post('/tarot/draw')
        .set('Cookie', headers.Cookie)
        .send({ type: 'SINGLE_CARD' })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('Lifecycle (Phase 3)', () => {
    it('archive -> restore returns to ACTIVE, and delete -> restore does the same, each writing real history', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('lifecycle'));
      const created = await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'SINGLE_CARD' }).expect(201);
      const id = (created.body.data as TarotReadingApi).id;

      const archived = await request(app.getHttpServer()).post(`/tarot/readings/${id}/archive`).set(headers).expect(201);
      expect(archived.body.data.status).toBe('ARCHIVED');
      const restored = await request(app.getHttpServer()).post(`/tarot/readings/${id}/restore`).set(headers).expect(201);
      expect(restored.body.data.status).toBe('ACTIVE');

      const deleted = await request(app.getHttpServer()).delete(`/tarot/readings/${id}`).set(headers).expect(200);
      expect(deleted.body.data.status).toBe('DELETED');
      const restoredAgain = await request(app.getHttpServer()).post(`/tarot/readings/${id}/restore`).set(headers).expect(201);
      expect(restoredAgain.body.data.status).toBe('ACTIVE');

      const history = await request(app.getHttpServer()).get(`/tarot/readings/${id}/history`).set(headers).expect(200);
      const actions = (history.body.data as { action: string }[]).map((h) => h.action);
      expect(actions).toEqual(expect.arrayContaining(['CREATED', 'ARCHIVED', 'RESTORED', 'DELETED']));
    });

    it('an invalid transition (archiving an already-archived reading) is rejected', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('invalid-transition'));
      const created = await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'SINGLE_CARD' }).expect(201);
      const id = (created.body.data as TarotReadingApi).id;
      await request(app.getHttpServer()).post(`/tarot/readings/${id}/archive`).set(headers).expect(201);
      await request(app.getHttpServer()).post(`/tarot/readings/${id}/archive`).set(headers).expect(400);
    });
  });

  describe('Ownership and cross-user isolation (Phase 9)', () => {
    it('getOne/history/archive/restore/delete 404 identically for a nonexistent id and another user’s reading', async () => {
      const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('other'));
      const created = await request(app.getHttpServer()).post('/tarot/draw').set(ownerHeaders).send({ type: 'SINGLE_CARD' }).expect(201);
      const id = (created.body.data as TarotReadingApi).id;

      const forReal = await request(app.getHttpServer()).get(`/tarot/readings/${id}`).set(otherHeaders).expect(404);
      const forFake = await request(app.getHttpServer()).get('/tarot/readings/does-not-exist').set(otherHeaders).expect(404);
      expect(forReal.body.error.code).toBe(forFake.body.error.code);
      expect(forReal.body.error.code).toBe('TAROT_READING_NOT_FOUND');

      await request(app.getHttpServer()).get(`/tarot/readings/${id}/history`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/tarot/readings/${id}/archive`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).post(`/tarot/readings/${id}/restore`).set(otherHeaders).expect(404);
      await request(app.getHttpServer()).delete(`/tarot/readings/${id}`).set(otherHeaders).expect(404);
    });

    it('the reading list never includes another user’s readings', async () => {
      const mineHeaders = await registerAndGetHeaders(app, uniqueEmail('mine'));
      const theirsHeaders = await registerAndGetHeaders(app, uniqueEmail('theirs'));
      await request(app.getHttpServer()).post('/tarot/draw').set(theirsHeaders).send({ type: 'SINGLE_CARD', question: 'theirs' }).expect(201);
      await request(app.getHttpServer()).post('/tarot/draw').set(mineHeaders).send({ type: 'SINGLE_CARD', question: 'mine' }).expect(201);

      const list = await request(app.getHttpServer()).get('/tarot/readings').set(mineHeaders).expect(200);
      const questions = (list.body.data.items as { question: string }[]).map((r) => r.question);
      expect(questions).toEqual(['mine']);
    });
  });
});
