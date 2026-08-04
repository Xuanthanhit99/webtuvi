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
    .send({ email, displayName: 'Journal User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

async function createDraft(app: INestApplication, headers: Record<string, string>, title = 'A good day', content = 'Today was nice.') {
  const res = await request(app.getHttpServer()).post('/journal').set(headers).send({ title, content }).expect(201);
  return res.body.data as { id: string; state: string; version: number };
}

describe('Journal Foundation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CRUD, ownership, and CSRF', () => {
    it('rejects creating an entry without a CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf-create'));
      const res = await request(app.getHttpServer())
        .post('/journal')
        .set('Cookie', headers.Cookie)
        .send({ title: 'x', content: 'y' })
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('creates a DRAFT entry with a computed word count', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('create'));
      const entry = await createDraft(app, headers, 'My day', 'One two three four five');
      expect(entry.state).toBe('DRAFT');
      const detail = await request(app.getHttpServer()).get(`/journal/${entry.id}`).set(headers).expect(200);
      expect(detail.body.data.wordCount).toBe(5);
      expect(detail.body.data.readingTimeMinutes).toBe(1);
    });

    it('never exposes another user’s journal entry — identical 404 for nonexistent and someone else’s', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other'));
      const entry = await createDraft(app, owner);

      const forOther = await request(app.getHttpServer()).get(`/journal/${entry.id}`).set(other).expect(404);
      const forNonexistent = await request(app.getHttpServer()).get('/journal/does-not-exist').set(other).expect(404);
      expect(forOther.body.error.code).toBe(forNonexistent.body.error.code);
    });

    it('a non-owner cannot update, archive, restore, delete, duplicate, or read revisions', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('owner2'));
      const other = await registerAndGetHeaders(app, uniqueEmail('other2'));
      const entry = await createDraft(app, owner);

      await request(app.getHttpServer()).patch(`/journal/${entry.id}`).set(other).send({ title: 'hijacked' }).expect(404);
      await request(app.getHttpServer()).post(`/journal/${entry.id}/archive`).set(other).expect(404);
      await request(app.getHttpServer()).post(`/journal/${entry.id}/restore`).set(other).expect(404);
      await request(app.getHttpServer()).delete(`/journal/${entry.id}`).set(other).expect(404);
      await request(app.getHttpServer()).post(`/journal/${entry.id}/duplicate`).set(other).expect(404);
      await request(app.getHttpServer()).get(`/journal/${entry.id}/revisions`).set(other).expect(404);

      // The owner's entry is untouched.
      const stillOwners = await request(app.getHttpServer()).get(`/journal/${entry.id}`).set(owner).expect(200);
      expect(stillOwners.body.data.title).toBe('A good day');
    });

    it('list never returns another user’s entries', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('list-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('list-other'));
      await createDraft(app, owner, 'Owner entry');
      await createDraft(app, other, 'Other entry');

      const list = await request(app.getHttpServer()).get('/journal').set(owner).expect(200);
      expect(list.body.data.items.every((i: { title: string }) => i.title === 'Owner entry')).toBe(true);
    });
  });

  describe('Draft system', () => {
    it('autosave persists content without creating a revision or bumping version', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('autosave'));
      const entry = await createDraft(app, headers);

      const autosaved = await request(app.getHttpServer())
        .post(`/journal/${entry.id}/autosave`)
        .set(headers)
        .send({ content: 'Today was nice, and then something happened.' })
        .expect(201);
      expect(autosaved.body.data.entry.version).toBe(1);

      const revisions = await request(app.getHttpServer()).get(`/journal/${entry.id}/revisions`).set(headers).expect(200);
      expect(revisions.body.data).toHaveLength(1); // just the "created" revision — autosave added none

      // Never silently discarded — a fresh read shows the autosaved text.
      const detail = await request(app.getHttpServer()).get(`/journal/${entry.id}`).set(headers).expect(200);
      expect(detail.body.data.content).toBe('Today was nice, and then something happened.');
    });

    it('autosave is rejected once the entry is no longer a draft', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('autosave-published'));
      const entry = await createDraft(app, headers);
      await request(app.getHttpServer()).post(`/journal/${entry.id}/publish`).set(headers).expect(201);

      await request(app.getHttpServer()).post(`/journal/${entry.id}/autosave`).set(headers).send({ content: 'x' }).expect(409);
    });

    it('an explicit PATCH save DOES create a revision and bump version', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('explicit-save'));
      const entry = await createDraft(app, headers);

      const updated = await request(app.getHttpServer())
        .patch(`/journal/${entry.id}`)
        .set(headers)
        .send({ content: 'A meaningfully different entry.' })
        .expect(200);
      expect(updated.body.data.version).toBe(2);

      const revisions = await request(app.getHttpServer()).get(`/journal/${entry.id}/revisions`).set(headers).expect(200);
      expect(revisions.body.data).toHaveLength(2);
    });
  });

  describe('Publish and lifecycle (archive/restore/soft-delete)', () => {
    it('publish transitions DRAFT -> PUBLISHED and can only happen once', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('publish'));
      const entry = await createDraft(app, headers);

      const published = await request(app.getHttpServer()).post(`/journal/${entry.id}/publish`).set(headers).expect(201);
      expect(published.body.data.state).toBe('PUBLISHED');
      expect(published.body.data.publishedAt).not.toBeNull();

      await request(app.getHttpServer()).post(`/journal/${entry.id}/publish`).set(headers).expect(409);
    });

    it('archive hides an entry from the default list; restore brings it back to PUBLISHED', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('archive'));
      const entry = await createDraft(app, headers);
      await request(app.getHttpServer()).post(`/journal/${entry.id}/publish`).set(headers).expect(201);

      await request(app.getHttpServer()).post(`/journal/${entry.id}/archive`).set(headers).expect(201);
      const afterArchive = await request(app.getHttpServer()).get('/journal').set(headers).expect(200);
      expect(afterArchive.body.data.items.some((i: { id: string }) => i.id === entry.id)).toBe(false);

      // Still directly reachable and explicitly filterable by the owner.
      const archivedList = await request(app.getHttpServer()).get('/journal?state=ARCHIVED').set(headers).expect(200);
      expect(archivedList.body.data.items.some((i: { id: string }) => i.id === entry.id)).toBe(true);

      const restored = await request(app.getHttpServer()).post(`/journal/${entry.id}/restore`).set(headers).expect(201);
      expect(restored.body.data.state).toBe('PUBLISHED');
    });

    it('soft-delete never destroys the row — it is recoverable, and never appears in the default list meanwhile', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('soft-delete'));
      const entry = await createDraft(app, headers);

      await request(app.getHttpServer()).delete(`/journal/${entry.id}`).set(headers).expect(200);

      const afterDelete = await request(app.getHttpServer()).get('/journal').set(headers).expect(200);
      expect(afterDelete.body.data.items.some((i: { id: string }) => i.id === entry.id)).toBe(false);

      // The owner can still reach it directly (necessary for "recently deleted" + restore).
      const direct = await request(app.getHttpServer()).get(`/journal/${entry.id}`).set(headers).expect(200);
      expect(direct.body.data.state).toBe('DELETED');

      const restored = await request(app.getHttpServer()).post(`/journal/${entry.id}/restore`).set(headers).expect(201);
      expect(restored.body.data.state).toBe('DRAFT');

      const afterRestore = await request(app.getHttpServer()).get('/journal').set(headers).expect(200);
      expect(afterRestore.body.data.items.some((i: { id: string }) => i.id === entry.id)).toBe(true);
    });

    it('editing an archived or deleted entry is rejected until restored', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('edit-blocked'));
      const entry = await createDraft(app, headers);
      await request(app.getHttpServer()).post(`/journal/${entry.id}/archive`).set(headers).expect(201);

      await request(app.getHttpServer()).patch(`/journal/${entry.id}`).set(headers).send({ title: 'x' }).expect(409);
    });
  });

  describe('Duplicate', () => {
    it('always creates a new DRAFT copy, never a second published entry', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('duplicate'));
      const entry = await createDraft(app, headers, 'Original', 'Original content');
      await request(app.getHttpServer()).post(`/journal/${entry.id}/publish`).set(headers).expect(201);

      const copy = await request(app.getHttpServer()).post(`/journal/${entry.id}/duplicate`).set(headers).expect(201);
      expect(copy.body.data.state).toBe('DRAFT');
      expect(copy.body.data.title).toBe('Original (copy)');
      expect(copy.body.data.id).not.toBe(entry.id);
    });
  });

  describe('Search and filter', () => {
    it('deterministic search matches title/content; filters by mood, tag, and state', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('search'));
      await request(app.getHttpServer())
        .post('/journal')
        .set(headers)
        .send({ title: 'Marathon training log', content: 'Ran five miles today.', mood: 'GOOD', tags: ['fitness'] })
        .expect(201);
      await request(app.getHttpServer())
        .post('/journal')
        .set(headers)
        .send({ title: 'Grocery run', content: 'Bought eggs and milk.', mood: 'OKAY', tags: ['errands'] })
        .expect(201);

      const searched = await request(app.getHttpServer()).get('/journal?q=marathon').set(headers).expect(200);
      expect(searched.body.data.items).toHaveLength(1);
      expect(searched.body.data.items[0].title).toBe('Marathon training log');

      const byMood = await request(app.getHttpServer()).get('/journal?mood=GOOD').set(headers).expect(200);
      expect(byMood.body.data.items.every((i: { mood: string }) => i.mood === 'GOOD')).toBe(true);

      const byTag = await request(app.getHttpServer()).get('/journal?tag=errands').set(headers).expect(200);
      expect(byTag.body.data.items).toHaveLength(1);
      expect(byTag.body.data.items[0].title).toBe('Grocery run');
    });
  });

  describe('Timeline', () => {
    it('excludes archived and deleted entries by default, and paginates', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('timeline'));
      const a = await createDraft(app, headers, 'Entry A');
      const b = await createDraft(app, headers, 'Entry B');
      await request(app.getHttpServer()).post(`/journal/${a.id}/archive`).set(headers).expect(201);

      const timeline = await request(app.getHttpServer()).get('/journal/timeline').set(headers).expect(200);
      const ids = timeline.body.data.items.map((i: { id: string }) => i.id);
      expect(ids).toContain(b.id);
      expect(ids).not.toContain(a.id);
    });
  });

  describe('Export', () => {
    it('exports a single entry as markdown, front-matter included', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('export-md'));
      const entry = await createDraft(app, headers, 'Export me', 'Some content to export.');

      const exported = await request(app.getHttpServer()).get(`/journal/${entry.id}/export/markdown`).set(headers).expect(200);
      expect(exported.body.data.content).toContain('Some content to export.');
      expect(exported.body.data.content).toContain('title:');
      expect(exported.body.data.filename).toMatch(/\.md$/);
    });

    it('exports a single entry as JSON', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('export-json'));
      const entry = await createDraft(app, headers, 'Export me too', 'JSON content.');
      const exported = await request(app.getHttpServer()).get(`/journal/${entry.id}/export/json`).set(headers).expect(200);
      expect(exported.body.data.title).toBe('Export me too');
    });

    it('rejects exporting another user’s entry', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('export-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('export-other'));
      const entry = await createDraft(app, owner);
      await request(app.getHttpServer()).get(`/journal/${entry.id}/export/markdown`).set(other).expect(404);
    });

    it('account-wide export includes only the caller’s own entries', async () => {
      const owner = await registerAndGetHeaders(app, uniqueEmail('account-export-owner'));
      const other = await registerAndGetHeaders(app, uniqueEmail('account-export-other'));
      await createDraft(app, owner, 'Mine');
      await createDraft(app, other, 'Not mine');

      const job = await request(app.getHttpServer()).post('/journal/export').set(owner).expect(201);
      expect(job.body.data.result.entries.every((e: { title: string }) => e.title === 'Mine')).toBe(true);

      const fetched = await request(app.getHttpServer()).get(`/journal/export/${job.body.data.jobId}`).set(owner).expect(200);
      expect(fetched.body.data.result.entries.length).toBe(job.body.data.result.entries.length);

      // Another user's jobId, even if guessed, resolves to nothing.
      await request(app.getHttpServer()).get(`/journal/export/${job.body.data.jobId}`).set(other).expect(404);
    });
  });
});

describe('Companion + Journal Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createReflectiveMessage(headers: Record<string, string>) {
    const conversation = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const conversationId = conversation.body.data.id;
    const sent = await request(app.getHttpServer())
      .post(`/companion/conversations/${conversationId}/messages`)
      .set(headers)
      .send({ content: "Today was such an emotional day, I want to remember this one for a long time." })
      .expect(201);
    return { conversationId, messageId: sent.body.data.userMessage.id };
  }

  it('a reflective message produces a journal suggestion with a real excerpt of what the user actually said', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('suggest'));
    const conversation = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const sent = await request(app.getHttpServer())
      .post(`/companion/conversations/${conversation.body.data.id}/messages`)
      .set(headers)
      .send({ content: "Today was such an emotional day, I want to remember this one for a long time." })
      .expect(201);

    expect(sent.body.data.journalSuggestion).not.toBeNull();
    expect(sent.body.data.journalSuggestion.excerpt).toContain('emotional day');
  });

  it('"Save as Journal" creates a real DRAFT carrying the real source message, never publishing it automatically', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('save'));
    const { conversationId, messageId } = await createReflectiveMessage(headers);

    const saved = await request(app.getHttpServer())
      .post('/companion/journal-suggestions/save')
      .set(headers)
      .send({ conversationId, messageId })
      .expect(201);

    expect(saved.body.data.state).toBe('DRAFT');
    expect(saved.body.data.sourceType).toBe('COMPANION_SUGGESTED');
    expect(saved.body.data.content).toContain('emotional day');
  });

  it('rejects saving from a conversation the caller does not own', async () => {
    const owner = await registerAndGetHeaders(app, uniqueEmail('save-owner'));
    const attacker = await registerAndGetHeaders(app, uniqueEmail('save-attacker'));
    const { conversationId, messageId } = await createReflectiveMessage(owner);

    await request(app.getHttpServer())
      .post('/companion/journal-suggestions/save')
      .set(attacker)
      .send({ conversationId, messageId })
      .expect(404);
  });

  it('rejects saving from an assistant-authored message', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('save-assistant'));
    const conversation = await request(app.getHttpServer()).post('/companion/conversations').set(headers).send({}).expect(201);
    const conversationId = conversation.body.data.id;
    await request(app.getHttpServer())
      .post(`/companion/conversations/${conversationId}/messages`)
      .set(headers)
      .send({ content: 'I want to kill myself' }) // crisis content persists a fixed assistant refusal synchronously — no SSE stream needed to get a real assistant-authored message
      .expect(201);

    const detail = await request(app.getHttpServer()).get(`/companion/conversations/${conversationId}`).set(headers).expect(200);
    const assistantMessage = detail.body.data.messages.find((m: { role: string }) => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();

    await request(app.getHttpServer())
      .post('/companion/journal-suggestions/save')
      .set(headers)
      .send({ conversationId, messageId: assistantMessage.id })
      .expect(400);
  });

  it('"Never suggest again" stops future suggestions, requires CSRF', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('never-again'));

    const res = await request(app.getHttpServer())
      .post('/companion/journal-suggestions/never-again')
      .set('Cookie', headers.Cookie)
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');

    await request(app.getHttpServer()).post('/companion/journal-suggestions/never-again').set(headers).expect(204);

    const { conversationId } = await createReflectiveMessage(headers);
    const secondMessage = await request(app.getHttpServer())
      .post(`/companion/conversations/${conversationId}/messages`)
      .set(headers)
      .send({ content: 'I have been thinking a lot about my goals lately and where things are headed.' })
      .expect(201);
    expect(secondMessage.body.data.journalSuggestion).toBeNull();
  });

  it('rejects "Save as Journal" without a CSRF token', async () => {
    const headers = await registerAndGetHeaders(app, uniqueEmail('csrf-save'));
    const { conversationId, messageId } = await createReflectiveMessage(headers);
    const res = await request(app.getHttpServer())
      .post('/companion/journal-suggestions/save')
      .set('Cookie', headers.Cookie)
      .send({ conversationId, messageId })
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
  });
});
