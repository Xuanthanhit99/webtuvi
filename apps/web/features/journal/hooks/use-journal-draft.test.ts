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
});
