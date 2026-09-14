'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { JournalEntryDto, JournalMoodValue } from '@beaconvie/types';
import { journalApi } from '../api/journal-api';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

const AUTOSAVE_DEBOUNCE_MS = 2000;
const LOCAL_BACKUP_PREFIX = 'beaconvie:journal-draft:';

interface LocalBackup {
  title: string;
  content: string;
  mood: JournalMoodValue | null;
  tags: string[];
  savedAt: string;
}

function backupKey(id: string): string {
  return `${LOCAL_BACKUP_PREFIX}${id}`;
}

/** Best-effort — a `localStorage` failure (private browsing, quota) never blocks writing; it only
 * means the extra client-side safety net isn't there for this tick. The server-side autosave
 * (Phase 3's actual persistence) is unaffected either way. */
function writeLocalBackup(id: string, backup: LocalBackup): void {
  try {
    window.localStorage.setItem(backupKey(id), JSON.stringify(backup));
  } catch {
    // Best-effort only.
  }
}

function readLocalBackup(id: string): LocalBackup | null {
  try {
    const raw = window.localStorage.getItem(backupKey(id));
    return raw ? (JSON.parse(raw) as LocalBackup) : null;
  } catch {
    return null;
  }
}

function clearLocalBackup(id: string): void {
  try {
    window.localStorage.removeItem(backupKey(id));
  } catch {
    // Best-effort only.
  }
}

function recoverableBackupFor(entry: JournalEntryDto): LocalBackup | null {
  const backup = readLocalBackup(entry.id);
  return backup && new Date(backup.savedAt).getTime() > new Date(entry.updatedAt).getTime() ? backup : null;
}

/**
 * Owns one draft entry's autosave loop (Phase 3). Two layers of "never silently discard user
 * writing":
 *
 * 1. A debounced autosave `POST /journal/:id/autosave` — the real, server-persisted save. Never
 *    versions (see JournalRecordService.autosave()'s own docs) since it fires on every pause in
 *    typing, not on a meaningful edit boundary.
 * 2. A synchronous `localStorage` mirror written on every keystroke, *before* the debounce timer
 *    even starts — this is what "recovery after refresh" actually depends on: if the tab closes
 *    or crashes in the 2-second window before the debounced network save completes, the local
 *    backup already has the latest text. It is compared against the server's own `updatedAt` on
 *    load; if the local backup is newer, the caller is offered a choice to recover it rather than
 *    it being silently applied or silently discarded (conflict-safe save — Phase 3's own
 *    requirement) or silently overwritten.
 */
export function useJournalDraft(entry: JournalEntryDto) {
  const [title, setTitleState] = useState(entry.title);
  const [content, setContentState] = useState(entry.content);
  const [mood, setMoodState] = useState<JournalMoodValue | null>(entry.mood);
  const [tags, setTagsState] = useState<string[]>(entry.tags);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [recoverableBackup, setRecoverableBackup] = useState<LocalBackup | null>(() => recoverableBackupFor(entry));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const entryIdRef = useRef(entry.id);

  // A local backup strictly newer than the server's own last save is offered for recovery once,
  // right after mount — this is the "recover unsaved changes" half of Phase 3, distinct from the
  // autosave loop itself. Recomputed (not just conditionally set) on every run so switching to an
  // entry with no qualifying backup of its own correctly clears a stale one left over from
  // whatever entry was previously shown, rather than leaving it dangling.
  //
  // Deliberately depends on [entry.id, entry.updatedAt] — the two fields that actually determine
  // the answer — rather than the whole `entry` object. An unrelated background refetch of this
  // same entry (e.g. another mutation elsewhere invalidating the shared ['journal'] query prefix)
  // produces a new `entry` object reference with the same id/updatedAt; depending on `entry`
  // itself would re-run this on every such refetch and could pop the recovery banner back open
  // mid-typing purely because of that reference change, even though nothing about recoverability
  // actually changed.
  useEffect(() => {
    queueMicrotask(() => setRecoverableBackup(recoverableBackupFor(entry)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on id/updatedAt only; see comment above.
  }, [entry.id, entry.updatedAt]);

  // JournalHome/JournalDetail intentionally reuse the same JournalEditor instance across entries
  // instead of remounting it (see journal-home.tsx) — so nothing else in this hook resets when
  // `entry` switches to a different entry. Without this, switching entries left every field
  // (title/content/mood/tags) and `entryIdRef` frozen on whichever entry was viewed first: typed
  // text for the new entry would autosave under the *previous* entry's id, silently overwriting
  // it, while the new entry's real edits never reached its own record. Guarded on entry.id alone
  // (not the whole `entry` object) so a background refetch of the *same* entry never clobbers
  // in-progress unsaved local edits.
  useEffect(() => {
    if (entryIdRef.current === entry.id) return;
    const previousId = entryIdRef.current;
    const pendingSave = dirtyRef.current ? { title, content, mood, tags } : null;

    entryIdRef.current = entry.id;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    dirtyRef.current = false;

    queueMicrotask(() => {
      setTitleState(entry.title);
      setContentState(entry.content);
      setMoodState(entry.mood);
      setTagsState(entry.tags);
      setStatus('idle');
      setLastSavedAt(null);
    });

    // Best-effort, mirroring the unmount-flush effect below: a debounced save still pending for
    // the entry being left behind must not simply be cancelled outright. Its local backup (already
    // written on every keystroke) is the real safety net either way, but flushing here saves an
    // extra "revisit the old entry, see the recovery banner, apply it" round trip.
    if (pendingSave) {
      journalApi.autosave(previousId, pendingSave).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on entry.id only; see comment above.
  }, [entry.id]);

  const flush = useCallback(async (id: string, next: { title: string; content: string; mood: JournalMoodValue | null; tags: string[] }) => {
    if (!dirtyRef.current) return;
    setStatus('saving');
    try {
      const result = await journalApi.autosave(id, next);
      dirtyRef.current = false;
      setStatus('saved');
      setLastSavedAt(result.savedAt);
      clearLocalBackup(id);
    } catch {
      setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error');
      // Deliberately does NOT clear the local backup on failure — that's the whole point of
      // keeping it: a failed network save must never look the same as a successful one.
    }
  }, []);

  const scheduleSave = useCallback(
    (next: { title: string; content: string; mood: JournalMoodValue | null; tags: string[] }) => {
      dirtyRef.current = true;
      writeLocalBackup(entryIdRef.current, { ...next, savedAt: new Date().toISOString() });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void flush(entryIdRef.current, next), AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Save immediately on unmount/navigation if a debounced save is still pending — "never
  // silently discard" applies to leaving the page, not only to a crash. Best-effort: by the
  // time this fires there is no component left to show an error status to, and the local
  // backup (already written on every keystroke) is the real safety net for this case, so a
  // failure here is swallowed rather than becoming an unhandled rejection.
  useEffect(
    () => () => {
      if (dirtyRef.current) {
        journalApi.autosave(entryIdRef.current, { title, content, mood, tags }).catch(() => undefined);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only runs the latest values on unmount
    [],
  );

  function setTitle(next: string) {
    setTitleState(next);
    scheduleSave({ title: next, content, mood, tags });
  }

  function setContent(next: string) {
    setContentState(next);
    scheduleSave({ title, content: next, mood, tags });
  }

  function setMood(next: JournalMoodValue | null) {
    setMoodState(next);
    scheduleSave({ title, content, mood: next, tags });
  }

  function setTags(next: string[]) {
    setTagsState(next);
    scheduleSave({ title, content, mood, tags: next });
  }

  /** Explicit save (e.g. Ctrl/Cmd+S) — flushes immediately instead of waiting for the debounce. */
  function saveNow() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void flush(entryIdRef.current, { title, content, mood, tags });
  }

  function applyRecoveredBackup() {
    if (!recoverableBackup) return;
    const { title: nextTitle, content: nextContent, mood: nextMood, tags: nextTags } = recoverableBackup;
    setTitleState(nextTitle);
    setContentState(nextContent);
    setMoodState(nextMood);
    setTagsState(nextTags);
    // Only the four real fields — never the backup's own `savedAt` bookkeeping field, which the
    // API's whitelist validation (correctly) rejects as an unrecognized field.
    scheduleSave({ title: nextTitle, content: nextContent, mood: nextMood, tags: nextTags });
    setRecoverableBackup(null);
  }

  function discardRecoveredBackup() {
    clearLocalBackup(entry.id);
    setRecoverableBackup(null);
  }

  return {
    title,
    content,
    mood,
    tags,
    setTitle,
    setContent,
    setMood,
    setTags,
    status,
    lastSavedAt,
    saveNow,
    recoverableBackup,
    applyRecoveredBackup,
    discardRecoveredBackup,
  };
}
