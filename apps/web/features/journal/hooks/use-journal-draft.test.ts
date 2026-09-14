import { renderHook, act, waitFor } from '@testing-library/react';
import type { JournalEntryDto } from '@beaconvie/types';
import { useJournalDraft } from './use-journal-draft';
import { journalApi } from '../api/journal-api';

jest.mock('../api/journal-api', () => ({
  journalApi: { autosave: jest.fn() },
}));

function makeEntry(overrides: Partial<JournalEntryDto> = {}): JournalEntryDto {
  return {
    id: 'j-1',
    title: 'Untitled',
    content: '',
    state: 'DRAFT',
    visibility: 'PRIVATE',
    mood: null,
    tags: [],
    pinned: false,
    wordCount: 0,
    readingTimeMinutes: 0,
    version: 1,
    sourceType: 'USER',
    sourceConversationId: null,
    sourceMessageId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

describe('useJournalDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // A real default: the unmount-flush effect calls this unconditionally whenever a change is
    // still pending, in every test (not only the ones that explicitly assert on it) — matching
    // what the real API always returns (a Promise), a bare `jest.fn()` with no implementation
    // does not.
    (journalApi.autosave as jest.Mock).mockResolvedValue({ entry: makeEntry(), savedAt: '2026-01-01T00:00:05.000Z' });
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('never calls the server until the debounce elapses — a keystroke alone does not save immediately', () => {
    const { result } = renderHook(() => useJournalDraft(makeEntry()));
    act(() => result.current.setContent('a'));
    expect(journalApi.autosave).not.toHaveBeenCalled();
  });

  it('autosaves after the debounce window, never silently discarding what was typed', async () => {
    (journalApi.autosave as jest.Mock).mockResolvedValue({ entry: makeEntry({ content: 'hello world' }), savedAt: '2026-01-01T00:00:05.000Z' });
    const { result } = renderHook(() => useJournalDraft(makeEntry()));

    act(() => result.current.setContent('hello world'));
    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => expect(journalApi.autosave).toHaveBeenCalledWith('j-1', expect.objectContaining({ content: 'hello world' })));
  });

  it('rapid typing collapses into a single autosave call, not one per keystroke', async () => {
    (journalApi.autosave as jest.Mock).mockResolvedValue({ entry: makeEntry(), savedAt: '2026-01-01T00:00:05.000Z' });
    const { result } = renderHook(() => useJournalDraft(makeEntry()));

    act(() => result.current.setContent('h'));
    act(() => jest.advanceTimersByTime(500));
    act(() => result.current.setContent('he'));
    act(() => jest.advanceTimersByTime(500));
    act(() => result.current.setContent('hel'));
    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => expect(journalApi.autosave).toHaveBeenCalledTimes(1));
    expect(journalApi.autosave).toHaveBeenCalledWith('j-1', expect.objectContaining({ content: 'hel' }));
  });

  it('a failed autosave keeps the local backup instead of silently pretending success', async () => {
    (journalApi.autosave as jest.Mock).mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useJournalDraft(makeEntry()));

    act(() => result.current.setContent('important text'));
    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(window.localStorage.getItem('beaconvie:journal-draft:j-1')).not.toBeNull();
  });

  it('saveNow() flushes immediately without waiting for the debounce', async () => {
    (journalApi.autosave as jest.Mock).mockResolvedValue({ entry: makeEntry(), savedAt: '2026-01-01T00:00:05.000Z' });
    const { result } = renderHook(() => useJournalDraft(makeEntry()));

    act(() => result.current.setContent('urgent'));
    act(() => result.current.saveNow());

    await waitFor(() => expect(journalApi.autosave).toHaveBeenCalledWith('j-1', expect.objectContaining({ content: 'urgent' })));
  });

  it('offers recovery when a newer local backup exists than the server’s own last save', () => {
    window.localStorage.setItem(
      'beaconvie:journal-draft:j-1',
      JSON.stringify({ title: 'Recovered', content: 'Recovered text', mood: null, tags: [], savedAt: '2026-06-01T00:00:00.000Z' }),
    );
    const { result } = renderHook(() => useJournalDraft(makeEntry({ updatedAt: '2026-01-01T00:00:00.000Z' })));
    expect(result.current.recoverableBackup).not.toBeNull();
    expect(result.current.recoverableBackup?.content).toBe('Recovered text');
  });

  it('does not offer recovery when the local backup is older than the server’s own last save', () => {
    window.localStorage.setItem(
      'beaconvie:journal-draft:j-1',
      JSON.stringify({ title: 'Stale', content: 'Stale text', mood: null, tags: [], savedAt: '2025-01-01T00:00:00.000Z' }),
    );
    const { result } = renderHook(() => useJournalDraft(makeEntry({ updatedAt: '2026-01-01T00:00:00.000Z' })));
    expect(result.current.recoverableBackup).toBeNull();
  });

  it('applying a recovered backup restores the text and schedules a save', async () => {
    (journalApi.autosave as jest.Mock).mockResolvedValue({ entry: makeEntry(), savedAt: '2026-01-01T00:00:05.000Z' });
    window.localStorage.setItem(
      'beaconvie:journal-draft:j-1',
      JSON.stringify({ title: 'Recovered', content: 'Recovered text', mood: null, tags: [], savedAt: '2026-06-01T00:00:00.000Z' }),
    );
    const { result } = renderHook(() => useJournalDraft(makeEntry({ updatedAt: '2026-01-01T00:00:00.000Z' })));

    act(() => result.current.applyRecoveredBackup());
    expect(result.current.content).toBe('Recovered text');
    expect(result.current.recoverableBackup).toBeNull();

    act(() => jest.advanceTimersByTime(2000));
    await waitFor(() => expect(journalApi.autosave).toHaveBeenCalledWith('j-1', expect.objectContaining({ content: 'Recovered text' })));
    // The real API rejects any field it doesn't declare (`forbidNonWhitelisted`) — this call must
    // send exactly title/content/mood/tags, never the local backup's own `savedAt` bookkeeping
    // field, or a real request would 400.
    const [, sentPayload] = (journalApi.autosave as jest.Mock).mock.calls[0]!;
    expect(sentPayload).not.toHaveProperty('savedAt');
    expect(Object.keys(sentPayload).sort()).toEqual(['content', 'mood', 'tags', 'title']);
  });

  it('discarding a recovered backup clears it without touching current content', () => {
    window.localStorage.setItem(
      'beaconvie:journal-draft:j-1',
      JSON.stringify({ title: 'Recovered', content: 'Recovered text', mood: null, tags: [], savedAt: '2026-06-01T00:00:00.000Z' }),
    );
    const { result } = renderHook(() => useJournalDraft(makeEntry({ content: 'Original', updatedAt: '2026-01-01T00:00:00.000Z' })));

    act(() => result.current.discardRecoveredBackup());
    expect(result.current.content).toBe('Original');
    expect(result.current.recoverableBackup).toBeNull();
    expect(window.localStorage.getItem('beaconvie:journal-draft:j-1')).toBeNull();
  });

  // JournalHome/JournalDetail intentionally reuse the same JournalEditor instance (and therefore
  // the same useJournalDraft hook instance) across entries rather than remounting on selection —
  // see journal-home.tsx. These prove the hook itself, not just its callers, gets that right.
  describe('switching entries in the same mounted instance (no remount)', () => {
    it('resyncs title/content/mood/tags to the new entry — never keeps showing/editing the previous entry', async () => {
      const entryA = makeEntry({ id: 'a', title: 'Title A', content: 'Content A' });
      const entryB = makeEntry({ id: 'b', title: 'Title B', content: 'Content B' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });
      expect(result.current.content).toBe('Content A');

      rerender({ entry: entryB });

      await waitFor(() => expect(result.current.title).toBe('Title B'));
      expect(result.current.content).toBe('Content B');
    });

    it('targets the new entry’s id for autosave after switching — never silently saves the new entry’s text under the old entry’s id', async () => {
      const entryA = makeEntry({ id: 'a', content: 'Content A' });
      const entryB = makeEntry({ id: 'b', content: 'Content B' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });

      rerender({ entry: entryB });
      act(() => result.current.setContent('typed for B'));
      act(() => result.current.saveNow());

      await waitFor(() => expect(journalApi.autosave).toHaveBeenCalledWith('b', expect.objectContaining({ content: 'typed for B' })));
      expect(journalApi.autosave).not.toHaveBeenCalledWith('a', expect.anything());
    });

    it('flushes a still-pending debounced save for the entry being left, instead of silently dropping it', async () => {
      const entryA = makeEntry({ id: 'a', content: 'Content A' });
      const entryB = makeEntry({ id: 'b', content: 'Content B' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });

      act(() => result.current.setContent('unsaved edit to A'));
      expect(journalApi.autosave).not.toHaveBeenCalled();

      rerender({ entry: entryB });

      await waitFor(() =>
        expect(journalApi.autosave).toHaveBeenCalledWith('a', expect.objectContaining({ content: 'unsaved edit to A' })),
      );
    });

    it('does not flush or reset anything when the entry object reference changes but the id stays the same (e.g. a background refetch)', () => {
      const entryA = makeEntry({ id: 'a', content: 'Content A' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });

      act(() => result.current.setContent('actively typing'));
      // A new object, same id — e.g. an unrelated mutation invalidated the ['journal'] query
      // prefix and this same entry refetched. Must never overwrite in-progress unsaved local text.
      rerender({ entry: makeEntry({ id: 'a', content: 'Content A' }) });

      expect(result.current.content).toBe('actively typing');
      expect(journalApi.autosave).not.toHaveBeenCalled();
    });

    it('offers the new entry’s own recoverable backup after switching, not the previous entry’s', async () => {
      window.localStorage.setItem(
        'beaconvie:journal-draft:b',
        JSON.stringify({ title: 'B', content: 'B backup content', mood: null, tags: [], savedAt: '2026-06-01T00:00:00.000Z' }),
      );
      const entryA = makeEntry({ id: 'a' });
      const entryB = makeEntry({ id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });
      expect(result.current.recoverableBackup).toBeNull();

      rerender({ entry: entryB });

      await waitFor(() => expect(result.current.recoverableBackup?.content).toBe('B backup content'));
    });

    it('clears a stale recoverableBackup from the previous entry when the new entry has no qualifying backup of its own', async () => {
      window.localStorage.setItem(
        'beaconvie:journal-draft:a',
        JSON.stringify({ title: 'A', content: 'A backup content', mood: null, tags: [], savedAt: '2026-06-01T00:00:00.000Z' }),
      );
      const entryA = makeEntry({ id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' });
      const entryB = makeEntry({ id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });
      await waitFor(() => expect(result.current.recoverableBackup).not.toBeNull());

      rerender({ entry: entryB });

      // Must not still be showing entry A's "recover unsaved changes?" banner while looking at B.
      await waitFor(() => expect(result.current.recoverableBackup).toBeNull());
    });

    it('resets autosave status to idle for the newly-shown entry, not stuck on the previous entry’s status', async () => {
      const entryA = makeEntry({ id: 'a', content: 'Content A' });
      const entryB = makeEntry({ id: 'b', content: 'Content B' });
      const { result, rerender } = renderHook(({ entry }) => useJournalDraft(entry), { initialProps: { entry: entryA } });

      act(() => result.current.setContent('edit A'));
      act(() => jest.advanceTimersByTime(2000));
      await waitFor(() => expect(result.current.status).toBe('saved'));

      rerender({ entry: entryB });

      await waitFor(() => expect(result.current.status).toBe('idle'));
    });
  });
});
