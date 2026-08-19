'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { JournalEntryDto, JournalMoodValue } from '@beaconvie/types';
import { useJournalDraft } from '../hooks/use-journal-draft';
import { journalApi } from '../api/journal-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { toast } from '@/components/ui/toast';

const MOOD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'No mood set' },
  { value: 'GREAT', label: 'Great' },
  { value: 'GOOD', label: 'Good' },
  { value: 'OKAY', label: 'Okay' },
  { value: 'LOW', label: 'Low' },
  { value: 'DIFFICULT', label: 'Difficult' },
];

const AVERAGE_WORDS_PER_MINUTE = 200;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

function statusLabel(status: string, lastSavedAt: string | null): string {
  switch (status) {
    case 'saving':
      return 'Saving…';
    case 'saved':
      return lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Saved';
    case 'error':
      return "Couldn't save — your text is kept locally, try again shortly.";
    case 'offline':
      return "You're offline — your text is kept locally and will save once you're back.";
    default:
      return '';
  }
}

/**
 * The Journal Editor (Phase 5): plain markdown textarea (no WYSIWYG/rich-text library — markdown
 * rendering happens only in the read view), autosave via `useJournalDraft`, live word/character
 * counts and reading-time estimate, Ctrl/Cmd+S for an explicit immediate save, native
 * browser undo/redo (a controlled `<textarea>` doesn't interfere with it). Deliberately no
 * collaborative editing — no presence, no operational transform, no multi-cursor anything.
 */
export function JournalEditor({ entry }: { entry: JournalEntryDto }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draft = useJournalDraft(entry);
  const isDraft = entry.state === 'DRAFT';
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const publish = useMutation({
    mutationFn: () => journalApi.publish(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Published.');
      router.refresh();
    },
    onError: () => toast.error("Couldn't publish right now. Please try again."),
  });

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        draft.saveNow();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [draft]);

  const wordCount = countWords(draft.content);
  const charCount = draft.content.length;
  const readingTime = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / AVERAGE_WORDS_PER_MINUTE));

  return (
    <div className="flex flex-col gap-4">
      {draft.recoverableBackup && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-insight/40 bg-insight/10 px-4 py-3">
          <p className="text-body-sm text-text-primary">
            We found unsaved changes from your last session — want to recover them?
          </p>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={draft.applyRecoveredBackup}>
              Recover
            </Button>
            <Button size="sm" variant="secondary" onClick={draft.discardRecoveredBackup}>
              Discard
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="journal-title" className="sr-only">
          Title
        </label>
        <Input
          id="journal-title"
          value={draft.title}
          onChange={(e) => draft.setTitle(e.target.value)}
          placeholder="Untitled entry"
          maxLength={200}
          // Accessibility + Product Polish (2026-08-19): previously included
          // focus-visible:outline-none with no replacement, silently dropping the app-wide
          // focus ring convention (Input's own base classes already provide
          // focus-visible:outline-insight — this override was suppressing it, not replacing it).
          className="border-none bg-transparent px-0 font-display text-heading-md"
        />
        <span role="status" aria-live="polite" className="shrink-0 text-caption text-text-tertiary">
          {statusLabel(draft.status, draft.lastSavedAt)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Dropdown
          id="journal-mood"
          label="Mood"
          value={draft.mood ?? ''}
          options={MOOD_OPTIONS}
          onChange={(value) => draft.setMood(value ? (value as JournalMoodValue) : null)}
          className="w-48"
        />
        <label htmlFor="journal-tags" className="sr-only">
          Tags, comma separated
        </label>
        <Input
          id="journal-tags"
          defaultValue={draft.tags.join(', ')}
          onBlur={(e) =>
            draft.setTags(
              e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
          placeholder="Tags, comma separated"
          className="w-64"
        />
      </div>

      <label htmlFor="journal-content" className="sr-only">
        Entry content
      </label>
      <textarea
        id="journal-content"
        ref={contentRef}
        value={draft.content}
        onChange={(e) => draft.setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={16}
        className="min-h-[300px] w-full resize-y rounded-md border border-border-subtle bg-surface p-4 font-mono text-body-md text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-text-secondary">
        <span>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} {charCount === 1 ? 'character' : 'characters'} · {readingTime} min read
        </span>
        {isDraft && (
          <Button onClick={() => publish.mutate()} loading={publish.isPending}>
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}
